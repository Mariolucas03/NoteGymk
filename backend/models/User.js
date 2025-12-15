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
    coins: { type: Number, default: 0 },

    // --- AQUÍ ESTABA EL ERROR ---
    // Borra "max: null". Déjalo solo así:
    lives: { type: Number, default: 100 },

    inventory: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
        quantity: { type: Number, default: 1 }
    }],

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