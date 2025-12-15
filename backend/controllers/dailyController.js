const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/DailyLog');
const Mission = require('../models/Mission');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Obtener log de HOY
const getDailyLog = asyncHandler(async (req, res) => {
    const today = getTodayDateString();
    const userId = req.user.id;

    // 1. Calcular total real de misiones
    const activeCount = await Mission.countDocuments({ user: userId, frequency: 'daily' });

    let log = await DailyLog.findOne({ user: userId, date: today });

    if (!log) {
        log = await DailyLog.create({
            user: userId,
            date: today,
            nutrition: { totalKcal: 0, breakfast: 0, lunch: 0, dinner: 0, snacks: 0, merienda: 0 },
            missionStats: { completed: 0, total: activeCount, listCompleted: [] },
            gains: { coins: 0, xp: 0, lives: 0 }
        });
    } else {
        // Sincronizar total de misiones si cambió
        if (log.missionStats.total !== activeCount) {
            log.missionStats.total = activeCount;
            await log.save();
        }
    }
    res.status(200).json(log);
});

// @desc    Obtener log de FECHA ESPECÍFICA
const getDailyLogByDate = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) { res.status(400); throw new Error('Falta fecha'); }
    const log = await DailyLog.findOne({ user: req.user.id, date: date });
    res.status(200).json(log || null);
});

// @desc    Actualizar log
const updateDailyLog = asyncHandler(async (req, res) => {
    const today = getTodayDateString();
    const userId = req.user.id;
    const { type, value } = req.body;

    let log = await DailyLog.findOne({ user: userId, date: today });
    if (!log) {
        const activeCount = await Mission.countDocuments({ user: userId, frequency: 'daily' });
        log = await DailyLog.create({
            user: userId, date: today,
            nutrition: { totalKcal: 0 },
            missionStats: { completed: 0, total: activeCount, listCompleted: [] }
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
            log.totalKcal = log.nutrition.totalKcal;
            break;

        case 'sport': log.sportWorkout = value; break;
        case 'training': log.gymWorkout = value; break;
        case 'missions': log.missionStats = value; break;
        case 'gains': log.gains = value; break;

        default: if (log[type] !== undefined) log[type] = value; break;
    }

    await log.save();
    res.status(200).json(log);
});

// @desc    Obtener historial peso (FALTABA ESTA FUNCIÓN)
const getWeightHistory = asyncHandler(async (req, res) => {
    const logs = await DailyLog.find({ user: req.user.id, weight: { $gt: 0 } })
        .sort({ date: 1 })
        .select('date weight');
    res.status(200).json(logs);
});

module.exports = {
    getDailyLog,
    getDailyLogByDate,
    updateDailyLog,
    getWeightHistory // ✅ Exportada correctamente
};