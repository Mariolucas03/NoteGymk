const Mission = require('../models/Mission');
const User = require('../models/User');

// --- CONFIGURACIÓN DE RECOMPENSAS ---
const REWARD_TABLE = {
    daily: {
        easy: { xp: 20, coins: 5, damage: 5 },
        medium: { xp: 50, coins: 15, damage: 3 },
        hard: { xp: 100, coins: 30, damage: 2 },
        epic: { xp: 250, coins: 80, damage: 0 }
    },
    weekly: {
        easy: { xp: 100, coins: 30, damage: 10 },
        medium: { xp: 250, coins: 75, damage: 5 },
        hard: { xp: 500, coins: 150, damage: 3 },
        epic: { xp: 1200, coins: 400, damage: 0 }
    },
    monthly: {
        easy: { xp: 500, coins: 150, damage: 20 },
        medium: { xp: 1200, coins: 400, damage: 10 },
        hard: { xp: 2500, coins: 800, damage: 5 },
        epic: { xp: 6000, coins: 2000, damage: 0 }
    },
    yearly: {
        easy: { xp: 2500, coins: 800, damage: 50 },
        medium: { xp: 6000, coins: 2000, damage: 25 },
        hard: { xp: 15000, coins: 5000, damage: 10 },
        epic: { xp: 50000, coins: 20000, damage: 0 }
    }
};

const getPeriodEnd = (date, frequency) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    if (frequency === 'daily') next.setDate(d.getDate() + 1);
    if (frequency === 'weekly') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7;
        next.setDate(diff);
    }
    if (frequency === 'monthly') {
        next.setMonth(d.getMonth() + 1);
        next.setDate(1);
    }
    if (frequency === 'yearly') {
        next.setFullYear(d.getFullYear() + 1);
        next.setMonth(0);
        next.setDate(1);
    }
    return next;
};

// --- GET Misiones (CORREGIDO Y ESTANDARIZADO) ---
const getMissions = async (req, res) => {
    try {
        // 1. Obtenemos usuario fresco de la DB
        const user = await User.findById(req.user._id);
        let missions = await Mission.find({ user: req.user._id });

        const now = new Date();
        const activeMissions = [];
        let userChanged = false;

        // 2. Procesar Misiones (Caducidad y Daño)
        for (let mission of missions) {
            const periodEnd = getPeriodEnd(mission.lastUpdated, mission.frequency);

            if (now >= periodEnd) {
                if (!mission.completed && mission.lifePenalty > 0) {
                    user.lives = Math.max(0, user.lives - mission.lifePenalty);
                    userChanged = true;
                }
                if (mission.type === 'temporal') {
                    await Mission.deleteOne({ _id: mission._id });
                    continue;
                } else if (mission.type === 'habit') {
                    mission.completed = false;
                    mission.progress = 0;
                    mission.lastUpdated = now;
                    await mission.save();
                }
            }
            activeMissions.push(mission);
        }

        // 3. BUCLE MÁGICO DE NIVEL (Igual que en dailyController)
        while (user.currentXP >= user.nextLevelXP) {
            user.currentXP -= user.nextLevelXP;
            user.level += 1;
            user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5);
            user.lives = 5;
            userChanged = true;
        }

        if (userChanged) await user.save();

        // 4. RESPUESTA ESTANDARIZADA (IGUAL QUE EN DAILY)
        // Esto asegura que el frontend reciba exactamente lo que espera
        res.json({
            missions: activeMissions,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                coins: user.coins,
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                lives: user.lives
            }
        });

    } catch (error) {
        console.error("Error getMissions:", error);
        res.status(500).json({ message: 'Error procesando misiones' });
    }
};

// Crear Misión
const createMission = async (req, res) => {
    try {
        const { title, frequency, type, difficulty, target } = req.body;
        const freq = frequency || 'daily';
        const diff = difficulty || 'easy';

        const rules = (REWARD_TABLE[freq] && REWARD_TABLE[freq][diff]) ? REWARD_TABLE[freq][diff] : REWARD_TABLE.daily.easy;

        const mission = await Mission.create({
            user: req.user._id,
            title, frequency: freq, type: type || 'habit', difficulty: diff, target: target || 1,
            xpReward: rules.xp, coinReward: rules.coins, lifePenalty: rules.damage
        });
        res.status(201).json(mission);
    } catch (error) {
        res.status(500).json({ message: 'Error creando misión' });
    }
};

// Completar Misión
const completeMission = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id);
        if (!mission || mission.completed) return res.status(400).json({ message: 'Error' });

        mission.progress += 1;
        let totalXP = 0, totalCoins = 0;
        let missionCompletedNow = false;

        if (mission.progress >= mission.target) {
            mission.completed = true;
            mission.progress = mission.target;
            totalXP += mission.xpReward;
            totalCoins += mission.coinReward;
            missionCompletedNow = true;
        }
        await mission.save();

        const siblingMissions = await Mission.find({ user: req.user._id, title: mission.title, _id: { $ne: mission._id }, completed: false });
        let synergyTriggered = 0;
        for (let sibling of siblingMissions) {
            sibling.progress += 1;
            synergyTriggered++;
            if (sibling.progress >= sibling.target) {
                sibling.completed = true;
                sibling.progress = sibling.target;
                totalXP += sibling.xpReward;
                totalCoins += sibling.coinReward;
            }
            await sibling.save();
        }

        let updatedUser = null;
        let leveledUp = false;

        if (totalXP > 0 || totalCoins > 0) {
            const user = await User.findById(req.user._id);
            user.coins += totalCoins;
            user.currentXP += totalXP;

            while (user.currentXP >= user.nextLevelXP) {
                user.currentXP -= user.nextLevelXP;
                user.level += 1;
                user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5);
                user.lives = 5;
                leveledUp = true;
            }
            await user.save();

            // Construimos el objeto usuario explícito para devolverlo
            updatedUser = {
                _id: user._id,
                username: user.username,
                email: user.email,
                coins: user.coins,
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                lives: user.lives
            };
        }

        res.json({
            mission, completed: missionCompletedNow,
            user: updatedUser, // Enviamos el usuario estructurado
            xp: totalXP, coins: totalCoins, synergyCount: synergyTriggered, leveledUp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error completando' });
    }
};

const deleteMission = async (req, res) => {
    try {
        await Mission.deleteOne({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Eliminada' });
    } catch (error) { res.status(500).json({ message: 'Error borrando' }); }
};

module.exports = { getMissions, createMission, completeMission, deleteMission };