const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/DailyLog');
const Mission = require('../models/Mission');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Obtener datos de HOY (Crea el día si no existe - Lógica de 00:00)
const getDailyLog = asyncHandler(async (req, res) => {
    const today = getTodayDateString();
    const userId = req.user._id;

    // --- CORRECCIÓN AQUÍ ---
    // Obtenemos el día de la semana actual (0 = Domingo, 1 = Lunes...)
    const currentDay = new Date().getDay();

    // Contamos misiones activas FILTRANDO por el día de hoy
    const activeCount = await Mission.countDocuments({
        user: userId,
        frequency: 'daily',
        $or: [
            { specificDays: { $size: 0 } }, // Si el array está vacío, es para todos los días
            { specificDays: currentDay }    // Si el array contiene el día de hoy
        ]
    });
    // ------------------------

    // 2. Buscamos el último log para persistir el peso
    const lastLog = await DailyLog.findOne({ user: userId }).sort({ date: -1 });
    const persistentWeight = lastLog ? lastLog.weight : 0;

    // 3. Operación Atómica: Buscar O Crear (Upsert)
    const log = await DailyLog.findOneAndUpdate(
        { user: userId, date: today },
        {
            $setOnInsert: { // Valores iniciales solo al crear
                user: userId,
                date: today,
                weight: persistentWeight,
                streakCurrent: req.user.streak.current,
                nutrition: { totalKcal: 0 },
                missionStats: { completed: 0, total: activeCount, listCompleted: [] },
                gains: { coins: 0, xp: 0, lives: 0 }
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // 4. Sincronización: Si el número de misiones válidas para HOY cambió, actualizamos el total
    // Esto arregla el widget si creas una misión para "Lunes" y hoy es "Domingo" (el total bajará)
    if (log.missionStats.total !== activeCount) {
        log.missionStats.total = activeCount;
        await log.save();
    }

    const logObj = log.toObject();
    logObj.totalKcal = log.nutrition.totalKcal; // Compatibilidad frontend

    res.status(200).json(logObj);
});

// @desc    Obtener datos de una FECHA ANTIGUA (Para el Perfil)
const getDailyLogByDate = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) { res.status(400); throw new Error('Falta fecha'); }

    const log = await DailyLog.findOne({ user: req.user._id, date: date });

    if (log) {
        const logObj = log.toObject();
        logObj.totalKcal = log.nutrition.totalKcal;
        res.status(200).json(logObj);
    } else {
        res.status(200).json(null);
    }
});

// @desc    Actualizar widgets (Peso, Sueño, Mood...)
const updateDailyLog = asyncHandler(async (req, res) => {
    const today = getTodayDateString();
    const userId = req.user._id;
    const { type, value } = req.body;

    let log = await DailyLog.findOne({ user: userId, date: today });

    // Safety check por si falló la creación inicial
    if (!log) {
        // Aquí también aplicamos el filtro de día por coherencia
        const currentDay = new Date().getDay();
        const activeCount = await Mission.countDocuments({
            user: userId,
            frequency: 'daily',
            $or: [{ specificDays: { $size: 0 } }, { specificDays: currentDay }]
        });

        const lastLog = await DailyLog.findOne({ user: userId }).sort({ date: -1 });

        log = await DailyLog.create({
            user: userId,
            date: today,
            weight: lastLog ? lastLog.weight : 0,
            nutrition: { totalKcal: 0 },
            missionStats: { total: activeCount }
        });
    }

    switch (type) {
        case 'mood': log.mood = value; break;
        case 'weight': log.weight = value; break;
        case 'sleepHours': log.sleepHours = value; break;
        case 'steps': log.steps = value; break;
        case 'streakCurrent': log.streakCurrent = value; break;

        case 'nutrition':
            log.nutrition = { ...log.nutrition, ...value };
            break;

        case 'sport': log.sportWorkouts = value; break;
        case 'training': log.gymWorkouts = value; break;
        case 'missions': log.missionStats = value; break;
        case 'gains': log.gains = value; break;

        default: if (log[type] !== undefined) log[type] = value; break;
    }

    await log.save();

    const logObj = log.toObject();
    logObj.totalKcal = log.nutrition.totalKcal;

    res.status(200).json(logObj);
});

const getWeightHistory = asyncHandler(async (req, res) => {
    const logs = await DailyLog.find({ user: req.user._id, weight: { $gt: 0 } })
        .sort({ date: 1 })
        .select('date weight');
    res.status(200).json(logs);
});

module.exports = { getDailyLog, getDailyLogByDate, updateDailyLog, getWeightHistory };