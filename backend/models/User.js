const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // --- ESTADÍSTICAS RPG ---
    stats: {
        level: { type: Number, default: 1 },
        currentXP: { type: Number, default: 0 },
        nextLevelXP: { type: Number, default: 100 },
        coins: { type: Number, default: 50 },

        // 🔥 NUEVA MONEDA (Fichas para juegos)
        gameCoins: { type: Number, default: 500 },

        hp: { type: Number, default: 100 },
        maxHp: { type: Number, default: 100 }
    },

    // Alias en raíz para compatibilidad
    coins: { type: Number, default: 50 },
    level: { type: Number, default: 1 },
    currentXP: { type: Number, default: 0 },
    nextLevelXP: { type: Number, default: 100 },
    lives: { type: Number, default: 100 },

    redemptionMission: { type: String, default: null },

    inventory: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
        quantity: { type: Number, default: 1 }
    }],

    macros: {
        calories: { type: Number, default: 2100 },
        protein: { type: Number, default: 150 },
        carbs: { type: Number, default: 200 },
        fat: { type: Number, default: 70 },
        fiber: { type: Number, default: 30 }
    },

    streak: {
        current: { type: Number, default: 1 },
        lastLogDate: { type: Date, default: Date.now }
    },

    dailyRewards: {
        claimedDays: { type: [Number], default: [] },
        lastClaimDate: { type: Date }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);