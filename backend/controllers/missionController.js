const asyncHandler = require('express-async-handler');
const Mission = require('../models/Mission');
const DailyLog = require('../models/DailyLog');
const levelService = require('../services/levelService');

const BASE_XP = 10;
const BASE_COINS = 5;

const DIFFICULTY_MULTIPLIERS = { easy: 1, medium: 2, hard: 3, epic: 5 };
const FREQUENCY_MULTIPLIERS = { daily: 1, weekly: 5, monthly: 15, yearly: 100 };

// --- OBTENER MISIONES ---
const getMissions = asyncHandler(async (req, res) => {
    const missions = await Mission.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(missions);
});

// --- CREAR MISIÓN ---
const createMission = asyncHandler(async (req, res) => {
    // 1. Recibimos 'specificDays' del frontend
    const { title, frequency, type, difficulty, target, specificDays } = req.body;

    if (!title) { res.status(400); throw new Error('Título obligatorio'); }

    const freq = frequency || 'daily';
    const diff = difficulty || 'easy';
    const missionType = type || 'habit';

    // 2. Validar días específicos (solo si es array)
    const days = Array.isArray(specificDays) ? specificDays : [];

    const mult = (DIFFICULTY_MULTIPLIERS[diff] || 1) * (FREQUENCY_MULTIPLIERS[freq] || 1);
    const finalXP = BASE_XP * mult;
    const finalCoins = BASE_COINS * mult;
    const finalGameCoins = finalCoins * 10;

    const mission = await Mission.create({
        user: req.user._id,
        title: title.trim(),
        frequency: freq,
        specificDays: days, // 🔥 GUARDAMOS LOS DÍAS
        type: missionType,
        difficulty: diff,
        target: Number(target) || 1,
        progress: 0,
        xpReward: finalXP,
        coinReward: finalCoins,
        gameCoinReward: finalGameCoins
    });

    res.status(201).json(mission);
});

// --- COMPLETAR MISIÓN (LÓGICA BLINDADA) ---
const completeMission = asyncHandler(async (req, res) => {
    const mission = await Mission.findById(req.params.id);
    if (!mission) { res.status(404); throw new Error('No encontrada'); }

    if (mission.user.toString() !== req.user._id.toString()) {
        res.status(401); throw new Error('No autorizado');
    }

    const today = new Date();

    // 1. VALIDACIÓN: Misión TEMPORAL ya completada
    if (mission.type === 'temporal' && mission.completed) {
        return res.status(400).json({ message: 'Misión única ya completada.' });
    }

    // 2. VALIDACIÓN: HÁBITO ya completado HOY
    if (mission.type === 'habit' && mission.completed) {
        const last = new Date(mission.lastUpdated);
        if (last.toDateString() === today.toDateString()) {
            return res.status(200).json({ message: 'Ya completada hoy', alreadyCompleted: true });
        }
        mission.progress = 0;
        mission.completed = false;
    }

    // 3. PROGRESO PARCIAL
    if (mission.target > 1 && mission.progress < mission.target - 1) {
        mission.progress += 1;
        mission.lastUpdated = today;
        await mission.save();
        return res.status(200).json({
            message: `Progreso: ${mission.progress}/${mission.target}`,
            mission: mission,
            progressOnly: true
        });
    }

    // 4. COMPLETAR FINALMENTE
    mission.completed = true;
    mission.progress = mission.target;
    mission.lastUpdated = today;
    await mission.save();

    // 5. 🔥 GUARDAR SNAPSHOT EN HISTORIAL (DailyLog) 🔥
    const todayStr = today.toISOString().split('T')[0];

    const isDaily = mission.frequency === 'daily';
    const incrementValue = isDaily ? 1 : 0;

    await DailyLog.findOneAndUpdate(
        { user: req.user._id, date: todayStr },
        {
            $inc: {
                'missionStats.completed': incrementValue,
                'gains.coins': mission.coinReward,
                'gains.xp': mission.xpReward
            },
            $push: {
                'missionStats.listCompleted': {
                    title: mission.title,
                    coinReward: mission.coinReward,
                    xpReward: mission.xpReward,
                    gameCoinReward: mission.gameCoinReward || 0,
                    frequency: mission.frequency,
                    difficulty: mission.difficulty,
                    type: mission.type
                }
            }
        },
        { upsert: true }
    );

    // 6. SINERGIA
    const relatedMissions = await Mission.find({
        user: req.user._id,
        title: mission.title,
        _id: { $ne: mission._id },
        completed: false
    });
    let synergyCount = 0;
    for (const related of relatedMissions) {
        if (related.progress < related.target) {
            related.progress += 1;
            if (related.progress >= related.target) {
                related.completed = true;
                related.lastUpdated = today;
            }
            await related.save();
            synergyCount++;
        }
    }

    // 7. DAR RECOMPENSAS
    const result = await levelService.addRewards(
        req.user._id,
        mission.xpReward,
        mission.coinReward,
        mission.gameCoinReward || 0
    );

    // 8. RESPONDER
    res.status(200).json({
        message: `¡Completado!`,
        user: result.user,
        leveledUp: result.leveledUp,
        rewards: {
            xp: mission.xpReward,
            coins: mission.coinReward,
            gameCoins: mission.gameCoinReward
        },
        mission: mission,
        synergyCount
    });
});

const deleteMission = asyncHandler(async (req, res) => {
    const mission = await Mission.findById(req.params.id);
    if (!mission) { res.status(404); throw new Error('No encontrada'); }
    await mission.deleteOne();
    res.status(200).json({ id: req.params.id });
});

module.exports = { getMissions, createMission, completeMission, deleteMission };