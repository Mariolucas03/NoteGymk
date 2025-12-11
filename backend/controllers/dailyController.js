const DailyLog = require('../models/DailyLog');
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog'); // Importado para historial

// Helper para obtener fecha formato "YYYY-MM-DD" local
const getTodayStr = () => {
    return new Date().toISOString().split('T')[0];
};

// @desc    Obtener o crear el log de hoy + buscar entreno realizado
// @route   GET /api/daily
const getDailyLog = async (req, res) => {
    try {
        const todayStr = getTodayStr();

        let log = await DailyLog.findOne({ user: req.user._id, date: todayStr });
        if (!log) {
            log = await DailyLog.create({ user: req.user._id, date: todayStr });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const workout = await WorkoutLog.findOne({
            user: req.user._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        res.json({
            ...log.toObject(),
            workout: workout || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo datos diarios' });
    }
};

// @desc    Actualizar un campo del log de hoy (Mood, Peso, Sueño...)
// @route   PUT /api/daily/update
const updateDailyItem = async (req, res) => {
    try {
        const todayStr = getTodayStr();
        const { type, value } = req.body;

        const log = await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: todayStr },
            { [type]: value },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(log);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando widget' });
    }
};

// @desc    Obtener historial de los últimos 7 días (Para gráficas)
// @route   GET /api/daily/history
const getHistory = async (req, res) => {
    try {
        const logs = await DailyLog.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(7)
            .select('date weight mood totalKcal');

        res.json(logs.reverse());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo historial' });
    }
};

// @desc    Obtener TODO el historial de una fecha específica (Para Perfil)
// @route   GET /api/daily/specific?date=YYYY-MM-DD
const getSpecificDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Falta la fecha' });

        const userId = req.user._id;

        // 1. DailyLog (Peso, Ánimo, Sueño)
        const daily = await DailyLog.findOne({ user: userId, date });

        // 2. WorkoutLog (Entrenamiento)
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const workout = await WorkoutLog.findOne({
            user: userId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        // 3. NutritionLog (Comidas)
        const nutrition = await NutritionLog.findOne({ user: userId, date });

        res.json({
            daily: daily || null,
            workout: workout || null,
            nutrition: nutrition || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error recuperando historial' });
    }
};

module.exports = { getDailyLog, updateDailyItem, getHistory, getSpecificDate };