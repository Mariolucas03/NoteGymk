const Mission = require('../models/Mission');
const User = require('../models/User');

// REGLAS DE JUEGO
// +Fácil = -Daño (Si fallas)
// +Difícil = +Recompensa y +Riesgo
const GAME_RULES = {
    easy: { xp: 10, coins: 5, damage: 5 }, // ¡Cuidado! Mucho daño si fallas lo fácil
    medium: { xp: 25, coins: 15, damage: 3 },
    hard: { xp: 50, coins: 30, damage: 1 },
    epic: { xp: 100, coins: 100, damage: 0 }  // Sin riesgo, solo gloria
};

// Helper: Calcular fin del periodo
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

// GET Misiones
const getMissions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        let missions = await Mission.find({ user: req.user._id });

        const now = new Date();
        const activeMissions = [];
        let userChanged = false;

        for (let mission of missions) {
            const periodEnd = getPeriodEnd(mission.lastUpdated, mission.frequency);

            // Si el plazo ha vencido
            if (now >= periodEnd) {
                // 1. Aplicar Daño si no se completó (Solo si es > 0)
                if (!mission.completed && mission.lifePenalty > 0) {
                    user.lives = Math.max(0, user.lives - mission.lifePenalty);
                    userChanged = true;
                }

                // 2. Gestión de reinicio/borrado
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

        if (userChanged) await user.save();
        res.json({ missions: activeMissions, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error procesando misiones' });
    }
};

// Crear Misión
const createMission = async (req, res) => {
    try {
        const { title, frequency, type, difficulty, target } = req.body;
        const rules = GAME_RULES[difficulty || 'easy'];

        const mission = await Mission.create({
            user: req.user._id,
            title,
            frequency: frequency || 'daily',
            type: type || 'habit',
            difficulty: difficulty || 'easy',
            target: target || 1,
            xpReward: rules.xp,
            coinReward: rules.coins,
            lifePenalty: rules.damage // <--- Guardamos el daño según la tabla
        });

        res.status(201).json(mission);
    } catch (error) {
        res.status(500).json({ message: 'Error creando misión' });
    }
};

// Completar Misión + SINERGIA
const completeMission = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id);
        if (!mission || mission.completed) return res.status(400).json({ message: 'Error' });

        // 1. Avanzar la misión actual
        mission.progress += 1;
        let userRewards = { xp: 0, coins: 0 };
        let missionCompletedNow = false;

        if (mission.progress >= mission.target) {
            mission.completed = true;
            mission.progress = mission.target;
            userRewards.xp += mission.xpReward;
            userRewards.coins += mission.coinReward;
            missionCompletedNow = true;
        }
        await mission.save();

        // 2. SINERGIA (Cascade Effect)
        // Buscamos otras misiones con el MISMO NOMBRE (ej: "Gym")
        const siblingMissions = await Mission.find({
            user: req.user._id,
            title: mission.title, // Nombre idéntico
            _id: { $ne: mission._id }, // Que no sea esta misma
            completed: false // Que no estén acabadas
        });

        let synergyTriggered = 0;

        for (let sibling of siblingMissions) {
            sibling.progress += 1; // Sumamos 1 al progreso de la hermana
            synergyTriggered++;

            // Si la hermana también se completa con este empujón
            if (sibling.progress >= sibling.target) {
                sibling.completed = true;
                sibling.progress = sibling.target;
                // ¡Bonus extra!
                userRewards.xp += sibling.xpReward;
                userRewards.coins += sibling.coinReward;
            }
            await sibling.save();
        }

        // 3. Guardar cambios en usuario
        let updatedUser = null;
        if (userRewards.xp > 0 || userRewards.coins > 0) {
            const user = await User.findById(req.user._id);
            user.currentXP += userRewards.xp;
            user.coins += userRewards.coins;

            if (user.currentXP >= user.nextLevelXP) {
                user.level += 1;
                user.currentXP -= user.nextLevelXP;
                user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5);
            }
            await user.save();
            updatedUser = user;
        }

        res.json({
            mission,
            completed: missionCompletedNow,
            user: updatedUser,
            xp: userRewards.xp,
            coins: userRewards.coins,
            synergyCount: synergyTriggered
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
    } catch (error) {
        res.status(500).json({ message: 'Error borrando' });
    }
};

module.exports = { getMissions, createMission, completeMission, deleteMission };