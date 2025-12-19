const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/DailyLog');
const Mission = require('../models/Mission');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Obtener datos de HOY (Crea el día si no existe - Lógica de 00:00)
const getDailyLog = asyncHandler(async (req, res) => {
    const today = getTodayDateString();
    const userId = req.user._id;

    // 1. Buscamos si ya existe el registro de HOY
    let log = await DailyLog.findOne({ user: userId, date: today });

    // 2. Contamos misiones activas para inicializar estadísticas
    const activeCount = await Mission.countDocuments({ user: userId, frequency: 'daily' });

    // 3. SI NO EXISTE (Es la primera vez que entras hoy o son las 00:01)
    if (!log) {
        console.log(`📅 Nuevo día detectado para ${req.user.username}: ${today}`);

        // A. Buscamos el ÚLTIMO registro anterior para copiar datos persistentes (Peso)
        const lastLog = await DailyLog.findOne({ user: userId }).sort({ date: -1 });

        // B. Preparamos los datos iniciales
        // - Nutrición, Pasos, Sueño, Mood: SE REINICIAN (0 o null)
        // - Peso: SE MANTIENE el de ayer (o 0 si es usuario nuevo)
        // - Racha: Se toma del usuario (ya calculada por el middleware)

        log = await DailyLog.create({
            user: userId,
            date: today,
            weight: lastLog ? lastLog.weight : 0, // <--- AQUÍ ESTÁ LA PERSISTENCIA DEL PESO
            streakCurrent: req.user.streak.current, // Guardamos la racha de hoy en la foto
            nutrition: { totalKcal: 0 },
            missionStats: { completed: 0, total: activeCount, listCompleted: [] },
            gains: { coins: 0, xp: 0, lives: 0 }
        });
    } else {
        // Si ya existe, solo actualizamos el total de misiones por si creaste una nueva
        if (log.missionStats.total !== activeCount) {
            log.missionStats.total = activeCount;
            await log.save();
        }
    }

    // Mapeo para frontend (retro-compatibilidad)
    const logObj = log.toObject();
    logObj.totalKcal = log.nutrition.totalKcal;

    // IMPORTANTE: Devolvemos SOLO el log, no el usuario.
    // El usuario se gestiona por separado (/users/me o contexto) para no sobrescribir datos.
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
        res.status(200).json(null); // Si no hay datos ese día, devolvemos null
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
        const activeCount = await Mission.countDocuments({ user: userId, frequency: 'daily' });
        // Intentar recuperar peso anterior si creamos de emergencia
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

        case 'sport': log.sportWorkouts = value; break; // Array
        case 'training': log.gymWorkouts = value; break; // Array
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