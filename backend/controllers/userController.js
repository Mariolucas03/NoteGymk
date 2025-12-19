const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const levelService = require('../services/levelService');

// @desc    Obtener datos del usuario actual (Con auto-reparación de nivel)
// @route   GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
    // 1. Ejecutar reparación de nivel por si la XP está desbordada
    // Esto soluciona el bug visual de "2000/600 XP"
    const repairedUser = await levelService.ensureLevelConsistency(req.user._id);

    // 2. Si hubo reparación usamos ese usuario, si no, buscamos el normal con populate
    let user = repairedUser;

    if (!user) {
        user = await User.findById(req.user._id);
    }

    // Aseguramos el populate del inventario en ambos casos
    // (Si vino de ensureLevelConsistency puede que no tenga el populate hecho)
    await user.populate('inventory.item');

    // Quitamos el password por seguridad antes de enviar
    user.password = undefined;

    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
});

// @desc    Actualizar objetivos nutricionales (Macros)
// @route   PUT /api/users/macros
const updateMacros = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    const { calories, protein, carbs, fat, fiber } = req.body;

    // Si el usuario es antiguo y no tiene 'macros', lo inicializamos
    if (!user.macros) {
        user.macros = {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 70,
            fiber: 30
        };
    }

    // Asignación explícita para evitar errores con subdocumentos Mongoose
    if (calories !== undefined) user.macros.calories = Number(calories);
    if (protein !== undefined) user.macros.protein = Number(protein);
    if (carbs !== undefined) user.macros.carbs = Number(carbs);
    if (fat !== undefined) user.macros.fat = Number(fat);
    if (fiber !== undefined) user.macros.fiber = Number(fiber);

    // Forzamos a Mongoose a saber que hemos tocado este objeto
    user.markModified('macros');

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
});

// @desc    Reclamar recompensa diaria
// @route   POST /api/users/claim-daily
const claimDailyReward = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // 1. VALIDACIÓN DE FECHA
    const today = new Date();
    const todayStr = today.toDateString();

    if (!user.dailyRewards) {
        user.dailyRewards = { claimedDays: [], lastClaimDate: null };
    }

    if (user.dailyRewards.lastClaimDate) {
        const lastClaim = new Date(user.dailyRewards.lastClaimDate);
        if (lastClaim.toDateString() === todayStr) {
            res.status(400);
            throw new Error('¡Ya has reclamado tu recompensa de hoy! Vuelve mañana.');
        }
    }

    // 2. LÓGICA DE RACHA (Día 1 a 7)
    const currentLength = user.dailyRewards.claimedDays.length;
    const currentDay = (currentLength % 7) + 1;

    // 3. CALCULAR PREMIO
    let rewardCoins = 50 + (currentDay * 10);
    let rewardXP = 20 + (currentDay * 5);

    if (currentDay === 7) {
        rewardCoins += 150;
        rewardXP += 100;
    }

    // 4. GUARDAR ESTADO
    user.dailyRewards.claimedDays.push(currentDay);
    user.dailyRewards.lastClaimDate = today;
    await user.save();

    // 5. APLICAR RECOMPENSAS
    const result = await levelService.addRewards(user._id, rewardXP, rewardCoins, 0);

    // 6. RESPONDER
    res.status(200).json({
        message: `¡Has reclamado el Día ${currentDay}!`,
        ...result.user.toObject(),
        dailyRewards: user.dailyRewards,
        rewardReceived: { xp: rewardXP, coins: rewardCoins }
    });
});

// @desc    Añadir recompensa genérica (Juegos, Ruleta, etc.)
// @route   POST /api/users/reward
const addGameReward = asyncHandler(async (req, res) => {
    const { coins, xp, gameCoins } = req.body;

    const result = await levelService.addRewards(
        req.user._id,
        Number(xp || 0),
        Number(coins || 0),     // Monedas Reales
        Number(gameCoins || 0)  // Fichas Virtuales
    );

    res.status(200).json({
        success: true,
        user: result.user,
        leveledUp: result.leveledUp,
        newBalance: result.user.coins,
        newGameCoins: result.user.stats.gameCoins
    });
});

// Mantenemos las funciones de redención y revive aquí para no romper rutas
// (Aunque idealmente deberían estar separadas, las dejamos para compatibilidad)
const setRedemptionMission = asyncHandler(async (req, res) => {
    const { mission } = req.body;
    if (!mission || mission.trim() === '') {
        return res.status(400).json({ message: "La misión es obligatoria" });
    }
    const user = await User.findById(req.user._id);
    if (user.redemptionMission) {
        return res.status(400).json({ message: "Pacto ya sellado." });
    }
    user.redemptionMission = mission;
    await user.save();
    res.json({ message: "Pacto sellado", user });
});

const reviveUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.stats.hp = 20; // Revive con poca vida
    user.lives = 20;    // Compatibilidad
    await user.save();
    res.json({ message: "Has revivido.", user });
});

const updateStatsManual = asyncHandler(async (req, res) => {
    const { hp, xp, coins } = req.body;
    const user = await User.findById(req.user._id);
    if (hp !== undefined) { user.stats.hp = hp; user.lives = hp; }
    if (xp !== undefined) user.stats.currentXP = xp;
    if (coins !== undefined) { user.stats.coins = coins; user.coins = coins; }
    await user.save();
    res.json(user);
});

module.exports = {
    getMe,
    updateMacros,
    claimDailyReward,
    addGameReward,
    setRedemptionMission,
    reviveUser,
    updateStatsManual
};