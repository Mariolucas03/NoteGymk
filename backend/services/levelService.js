const User = require('../models/User');

const calculateNextLevelXP = (level) => level * 100;

// Auto-reparación
const ensureLevelConsistency = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    let changed = false;
    if (!user.nextLevelXP || user.nextLevelXP === 0) {
        user.nextLevelXP = calculateNextLevelXP(user.level || 1);
        changed = true;
    }

    // Lógica de subir nivel
    while (user.currentXP >= user.nextLevelXP) {
        console.log(`🔧 NIVEL UP (Fix): ${user.level} -> ${user.level + 1}`);
        user.currentXP -= user.nextLevelXP;
        user.level = (user.level || 1) + 1;
        user.nextLevelXP = calculateNextLevelXP(user.level);
        user.hp = user.maxHp; // Restaurar vida completa (usando campo raíz)
        changed = true;
    }

    if (changed) await user.save();
    return user;
};

const addRewards = async (userId, xpReward, coinReward, gameCoinReward = 0) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Sumar directamente a la raíz
    user.currentXP += parseInt(xpReward) || 0;
    user.coins += parseInt(coinReward) || 0;
    user.gameCoins += parseInt(gameCoinReward) || 0;

    let leveledUp = false;
    if (!user.nextLevelXP) user.nextLevelXP = calculateNextLevelXP(user.level);

    // Check Level Up
    while (user.currentXP >= user.nextLevelXP) {
        console.log(`¡LEVEL UP! ${user.level} -> ${user.level + 1}`);
        user.currentXP -= user.nextLevelXP;
        user.level += 1;
        user.nextLevelXP = calculateNextLevelXP(user.level);

        user.hp = user.maxHp; // Restaurar vida
        // user.lives = user.hp; // Si decides eliminar 'lives' y usar solo 'hp', borra esto
        leveledUp = true;
    }

    const savedUser = await user.save();

    return {
        user: savedUser,
        leveledUp,
        rewards: { xp: xpReward, coins: coinReward, gameCoins: gameCoinReward }
    };
};

module.exports = { addRewards, ensureLevelConsistency };