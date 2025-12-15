const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },

    // --- STATS RPG ---
    level: { type: Number, default: 1 },
    currentXP: { type: Number, default: 0 },
    nextLevelXP: { type: Number, default: 100 },
    coins: { type: Number, default: 50 },
    lives: { type: Number, default: 100 },

    inventory: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
        quantity: { type: Number, default: 1 }
    }],

    // --- CONFIGURACIÓN DE OBJETIVOS (NUEVO) ---
    macros: {
        calories: { type: Number, default: 2100 },
        protein: { type: Number, default: 150 },
        carbs: { type: Number, default: 200 },
        fat: { type: Number, default: 70 },
        fiber: { type: Number, default: 30 }
    },

    // --- WIDGETS ---
    streak: {
        current: { type: Number, default: 1 },
        lastLogDate: { type: Date, default: Date.now }
    },
    activeWidgets: {
        type: [String],
        default: ['training', 'mood', 'food', 'steps', 'weight', 'sleep', 'streak', 'gains', 'missions', 'sports']
    },
    dailyRewards: {
        claimedDays: { type: [Number], default: [] },
        lastClaimDate: { type: Date }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);