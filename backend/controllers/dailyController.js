const DailyLog = require('../models/DailyLog');
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog');
const Mission = require('../models/Mission');
const User = require('../models/User');

const getTodayStr = () => new Date().toISOString().split('T')[0];

// @desc    Obtener dashboard completo (HOY)
// @route   GET /api/daily
const getDailyLog = async (req, res) => {
    try {
        const todayStr = getTodayStr();
        const userId = req.user._id; // ID SEGURO DEL TOKEN

        // 1. CÁLCULO DE RACHA Y OBTENCIÓN DE USUARIO
        // Buscamos al usuario para ver su racha y sus MONEDAS ACTUALES
        const user = await User.findById(userId);

        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let lastLogDate = user.streak?.lastLogDate ? new Date(user.streak.lastLogDate) : null;
        let lastLogMidnight = null;
        if (lastLogDate) {
            lastLogMidnight = new Date(lastLogDate.getFullYear(), lastLogDate.getMonth(), lastLogDate.getDate());
        }

        let currentStreak = user.streak?.current || 1;

        if (!lastLogMidnight) {
            currentStreak = 1;
        } else {
            const diffTime = todayMidnight - lastLogMidnight;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak += 1;
            } else if (diffDays > 1) {
                currentStreak = 1;
            }
        }

        // Guardar racha actualizada si es necesario
        if (!lastLogMidnight || todayMidnight > lastLogMidnight) {
            user.streak = { current: currentStreak, lastLogDate: now };
            await user.save();
        }

        // 2. DATOS DIARIOS BÁSICOS
        let log = await DailyLog.findOne({ user: userId, date: todayStr });
        if (!log) {
            log = await DailyLog.create({
                user: userId,
                date: todayStr,
                totalKcal: 0,
                mood: null
            });
        }

        // 3. BUSCAR ENTRENAMIENTOS
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        // A) Rutina de GYM
        const gymWorkout = await WorkoutLog.findOne({
            user: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            type: { $ne: 'sport' }
        }).sort({ date: -1 });

        // B) Rutina de DEPORTE
        const sportWorkout = await WorkoutLog.findOne({
            user: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            type: 'sport'
        }).sort({ date: -1 });

        // 4. NUTRICIÓN Y MISIONES
        const nutrition = await NutritionLog.findOne({ user: userId, date: todayStr });

        const allMissions = await Mission.find({ user: userId });
        const dailyMissions = allMissions.filter(m => m.frequency === 'daily');
        const listCompleted = allMissions.filter(m => m.completed);

        // 5. CÁLCULO DE GANANCIAS VISUALES (Informativo)
        let earnedCoins = 0, earnedXP = 0;

        listCompleted.forEach(mission => {
            earnedCoins += mission.coinReward || 0;
            earnedXP += mission.xpReward || 0;
        });

        if (gymWorkout) {
            earnedCoins += gymWorkout.earnedCoins || 0;
            earnedXP += gymWorkout.earnedXP || 0;
        }
        if (sportWorkout) {
            earnedCoins += sportWorkout.earnedCoins || 0;
            earnedXP += sportWorkout.earnedXP || 0;
        }

        // RESPUESTA FINAL
        res.json({
            ...log.toObject(),
            streakCurrent: currentStreak,
            gymWorkout: gymWorkout || null,
            sportWorkout: sportWorkout || null,
            nutrition: nutrition || null,
            missionStats: {
                total: dailyMissions.length,
                completed: listCompleted.length,
                listCompleted: listCompleted
            },
            gains: {
                coins: earnedCoins,
                xp: earnedXP
            },
            // --- ESTE ES EL BLOQUE QUE TE FALTABA ---
            // Enviamos los datos actuales del usuario (que vienen de la DB)
            // para que el Frontend actualice la barra de monedas/nivel al recargar.
            user: {
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                coins: user.coins,
                lives: user.lives,
                username: user.username || user.name
            }
        });

    } catch (error) {
        console.error("Error en getDailyLog:", error);
        res.status(500).json({ message: 'Error obteniendo datos diarios' });
    }
};

// @desc    Actualizar un campo del log
// @route   PUT /api/daily
const updateDailyItem = async (req, res) => {
    try {
        const todayStr = getTodayStr();
        const { type, value } = req.body;
        const userId = req.user._id;

        const log = await DailyLog.findOneAndUpdate(
            { user: userId, date: todayStr },
            { [type]: value },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(log);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando widget' });
    }
};

// @desc    Obtener historial 7 días
// @route   GET /api/daily/history
const getHistory = async (req, res) => {
    try {
        const logs = await DailyLog.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(7)
            .select('date weight mood totalKcal steps sleepHours');

        res.json(logs.reverse());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo historial' });
    }
};

// @desc    Obtener historial de una fecha específica
// @route   GET /api/daily/specific
const getSpecificDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Falta la fecha' });

        const userId = req.user._id;

        // 1. Logs básicos
        const daily = await DailyLog.findOne({ user: userId, date });

        // 2. Workouts
        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

        const gymWorkout = await WorkoutLog.findOne({
            user: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            type: { $ne: 'sport' }
        }).sort({ date: -1 });

        const sportWorkout = await WorkoutLog.findOne({
            user: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            type: 'sport'
        }).sort({ date: -1 });

        // 3. Nutrición
        const nutrition = await NutritionLog.findOne({ user: userId, date });

        // 4. Misiones
        const isToday = getTodayStr() === date;
        let missionStats = { listCompleted: [] };
        let earnedCoins = 0, earnedXP = 0;

        if (isToday) {
            const allMissions = await Mission.find({ user: userId });
            const listCompleted = allMissions.filter(m => m.completed);
            missionStats.listCompleted = listCompleted;

            listCompleted.forEach(m => {
                earnedCoins += m.coinReward || 0;
                earnedXP += m.xpReward || 0;
            });
        }

        if (gymWorkout) {
            earnedCoins += gymWorkout.earnedCoins || 0;
            earnedXP += gymWorkout.earnedXP || 0;
        }
        if (sportWorkout) {
            earnedCoins += sportWorkout.earnedCoins || 0;
            earnedXP += sportWorkout.earnedXP || 0;
        }

        res.json({
            daily: daily || null,
            gymWorkout: gymWorkout || null,
            sportWorkout: sportWorkout || null,
            nutrition: nutrition || null,
            missionStats: missionStats,
            gains: { coins: earnedCoins, xp: earnedXP }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error recuperando historial' });
    }
};

module.exports = { getDailyLog, updateDailyItem, getHistory, getSpecificDate };