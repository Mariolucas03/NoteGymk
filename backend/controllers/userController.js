const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const levelService = require('../services/levelService');
// 🔥 IMPORTAMOS LA FUNCIÓN MANUAL DEL SCHEDULER QUE ACABAMOS DE CREAR
const { runNightlyMaintenance } = require('../utils/scheduler');

// @desc    Obtener datos del usuario actual (Con auto-reparación)
const getMe = asyncHandler(async (req, res) => {
    // 1. Ejecutar reparación de nivel por si la XP está desbordada
    const user = await levelService.ensureLevelConsistency(req.user._id);

    // 2. Si hubo reparación usamos ese usuario, si no, buscamos el normal con populate
    let userToSend = user;

    if (!userToSend) {
        userToSend = await User.findById(req.user._id);
    }

    // Aseguramos el populate del inventario
    await userToSend.populate('inventory.item');

    // Quitamos el password por seguridad
    userToSend.password = undefined;

    if (userToSend) {
        res.status(200).json(userToSend);
    } else {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
});

// @desc    Actualizar objetivos nutricionales (Macros)
const updateMacros = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    const { calories, protein, carbs, fat, fiber } = req.body;

    if (!user.macros) {
        user.macros = { calories: 2000, protein: 150, carbs: 200, fat: 70, fiber: 30 };
    }

    if (calories !== undefined) user.macros.calories = Number(calories);
    if (protein !== undefined) user.macros.protein = Number(protein);
    if (carbs !== undefined) user.macros.carbs = Number(carbs);
    if (fat !== undefined) user.macros.fat = Number(fat);
    if (fiber !== undefined) user.macros.fiber = Number(fiber);

    user.markModified('macros');
    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
});

// @desc    Reclamar recompensa diaria
const claimDailyReward = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }

    // --- 1. NORMALIZAR FECHAS ---
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (!user.dailyRewards) {
        user.dailyRewards = { claimedDays: [], lastClaimDate: null };
    }

    // --- 2. VERIFICAR SI YA RECLAMÓ HOY ---
    if (user.dailyRewards.lastClaimDate) {
        const lastDate = new Date(user.dailyRewards.lastClaimDate);
        const lastDateStr = lastDate.toISOString().split('T')[0];

        if (lastDateStr === todayStr) {
            return res.status(400).json({
                success: false,
                message: '¡Ya has reclamado tu recompensa de hoy! Vuelve mañana.'
            });
        }
    }

    // --- 3. CALCULAR RACHA Y DÍA ACTUAL ---
    let currentDay = 1;

    if (user.dailyRewards.lastClaimDate) {
        const lastDate = new Date(user.dailyRewards.lastClaimDate);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastDateStr = lastDate.toISOString().split('T')[0];

        if (lastDateStr === yesterdayStr) {
            const currentStreak = user.dailyRewards.claimedDays.length;
            currentDay = (currentStreak % 7) + 1;
        } else {
            user.dailyRewards.claimedDays = [];
            currentDay = 1;
        }
    }

    // --- 4. DEFINIR PREMIOS ---
    let rewardCoins = currentDay;
    let rewardXP = currentDay * 10;

    if (currentDay === 7) {
        rewardCoins += 5;
        rewardXP += 50;
    }

    // --- 5. GUARDAR ---
    user.dailyRewards.claimedDays.push(currentDay);
    user.dailyRewards.lastClaimDate = now;
    await user.save();

    // Sumar usando el servicio centralizado (que ya usa ROOT fields)
    const result = await levelService.addRewards(user._id, rewardXP, rewardCoins, 0);

    res.status(200).json({
        success: true,
        message: `¡Has reclamado el Día ${currentDay}!`,
        user: result.user,
        reward: { xp: rewardXP, coins: rewardCoins, day: currentDay }
    });
});

// @desc    Añadir recompensa genérica (Juegos, Ruleta, etc.)
const addGameReward = asyncHandler(async (req, res) => {
    const { coins, xp, gameCoins } = req.body;

    // levelService ya escribe en root, así que esto es seguro
    const result = await levelService.addRewards(
        req.user._id,
        Number(xp || 0),
        Number(coins || 0),      // Monedas Reales
        Number(gameCoins || 0)   // Fichas Virtuales
    );

    res.status(200).json({
        success: true,
        user: result.user,
        leveledUp: result.leveledUp,
        newBalance: result.user.coins,
        newGameCoins: result.user.gameCoins // CORRECCIÓN: leer de root
    });
});

// @desc    Actualizar datos físicos
const updatePhysicalStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }

    const { age, height, gender } = req.body;

    user.physicalStats = {
        age: Number(age),
        height: Number(height),
        gender
    };

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
});

// --- FUNCIONES LEGACY / GAME OVER ---

const setRedemptionMission = asyncHandler(async (req, res) => {
    const { mission } = req.body;
    if (!mission || mission.trim() === '') return res.status(400).json({ message: "La misión es obligatoria" });
    const user = await User.findById(req.user._id);
    if (user.redemptionMission) return res.status(400).json({ message: "Pacto ya sellado." });
    user.redemptionMission = mission;
    await user.save();
    res.json({ message: "Pacto sellado", user });
});

const reviveUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    // CORRECCIÓN: Usar campos raíz
    user.hp = 20;
    user.lives = 20;
    await user.save();
    res.json({ message: "Has revivido.", user });
});

const updateStatsManual = asyncHandler(async (req, res) => {
    const { hp, xp, coins } = req.body;
    const user = await User.findById(req.user._id);

    // CORRECCIÓN: Usar campos raíz
    if (hp !== undefined) {
        user.hp = hp;
        user.lives = hp;
    }
    if (xp !== undefined) user.currentXP = xp;
    if (coins !== undefined) user.coins = coins;

    await user.save();
    res.json(user);
});

// @desc    DEBUG: Simular que la última conexión fue AYER
// @route   POST /api/users/debug/yesterday
const simulateYesterday = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Ponemos la fecha de último log a AYER
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    user.streak.lastLogDate = yesterday;
    // Opcional: Ponemos la racha en 1 para ver cómo sube a 2
    if (!user.streak.current || user.streak.current === 0) user.streak.current = 1;

    await user.save();

    res.json({
        message: "✅ Modo prueba activado: El sistema cree que entraste ayer.",
        streak: user.streak
    });
});

// @desc    DEBUG: Modificar racha manualmente
// @route   PUT /api/users/debug/streak
const setManualStreak = asyncHandler(async (req, res) => {
    const { days } = req.body;
    const user = await User.findById(req.user._id);

    user.streak.current = parseInt(days);
    // IMPORTANTE: Ponemos lastLogDate a hoy para que no sume +1 automáticamente al refrescar
    user.streak.lastLogDate = new Date();

    await user.save();
    res.json({ message: `Racha forzada a ${days}`, streak: user.streak });
});

// @desc    DEBUG: Forzar el paso de la noche (Castigos)
// @route   POST /api/users/debug/force-night
const forceNightlyMaintenance = asyncHandler(async (req, res) => {
    console.log("🔧 DEBUG: Forzando mantenimiento nocturno...");

    // Llamamos a la función importada de scheduler.js
    const result = await runNightlyMaintenance();

    // Devolvemos el usuario actualizado para que el frontend lo vea al instante
    const updatedUser = await User.findById(req.user._id);

    res.json({
        message: "🌃 Mantenimiento forzado ejecutado.",
        result,
        user: updatedUser
    });
});

module.exports = {
    getMe,
    updateMacros,
    claimDailyReward,
    addGameReward,
    setRedemptionMission,
    reviveUser,
    updateStatsManual,
    updatePhysicalStats,
    simulateYesterday,
    setManualStreak,
    forceNightlyMaintenance // Exportamos la función para que la ruta funcione
};