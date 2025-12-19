const User = require('../models/User');

const calculateNextLevelXP = (level) => level * 100;

// --- FUNCIÓN NUEVA: AUTO-REPARACIÓN DE NIVEL ---
const ensureLevelConsistency = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    let changed = false;

    // Asegurar que nextLevelXP tenga valor lógico
    if (!user.nextLevelXP || user.nextLevelXP === 0) {
        user.nextLevelXP = calculateNextLevelXP(user.level || 1);
        changed = true;
    }

    // Bucle de reparación: Mientras tengas más XP de la necesaria, subes de nivel
    while (user.currentXP >= user.nextLevelXP) {
        console.log(`🔧 REPARANDO NIVEL: ${user.level} -> ${user.level + 1}`);
        user.currentXP -= user.nextLevelXP;
        user.level = (user.level || 1) + 1;
        user.nextLevelXP = calculateNextLevelXP(user.level);

        // Restaurar vida al subir nivel
        user.stats.hp = 100;
        user.lives = 100;

        changed = true;
    }

    if (changed) {
        // Sincronizar el objeto stats con el root
        if (!user.stats) user.stats = {};
        user.stats.level = user.level;
        user.stats.currentXP = user.currentXP;
        user.stats.nextLevelXP = user.nextLevelXP;
        user.stats.coins = user.coins;
        // user.stats.gameCoins se mantiene igual

        await user.save();
    }

    return user;
};

// --- FUNCIÓN EXISTENTE (MANTENER) ---
const addRewards = async (userId, xpReward, coinReward, gameCoinReward = 0) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const xpAdd = parseInt(xpReward) || 0;
    const coinsAdd = parseInt(coinReward) || 0;
    const gameCoinsAdd = parseInt(gameCoinReward) || 0;

    user.currentXP = (user.currentXP || 0) + xpAdd;
    user.coins = (user.coins || 0) + coinsAdd;

    if (!user.stats) user.stats = {};
    user.stats.gameCoins = (user.stats.gameCoins || 0) + gameCoinsAdd;

    let leveledUp = false;
    if (!user.nextLevelXP) user.nextLevelXP = 100;

    while (user.currentXP >= user.nextLevelXP) {
        console.log(`¡LEVEL UP! ${user.level} -> ${user.level + 1}`);
        user.currentXP -= user.nextLevelXP;
        user.level = (user.level || 1) + 1;
        user.nextLevelXP = calculateNextLevelXP(user.level);

        user.stats.hp = 100;
        user.lives = 100;
        leveledUp = true;
    }

    // Sincronización Final
    user.stats.level = user.level;
    user.stats.currentXP = user.currentXP;
    user.stats.nextLevelXP = user.nextLevelXP;
    user.stats.coins = user.coins;

    const savedUser = await user.save();

    return {
        user: savedUser,
        leveledUp,
        rewards: { xp: xpAdd, coins: coinsAdd, gameCoins: gameCoinsAdd }
    };
};

module.exports = { addRewards, ensureLevelConsistency };