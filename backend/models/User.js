const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    nextLevelXp: { type: Number, default: 100 },
    coins: { type: Number, default: 0 },
    lives: { type: Number, default: 100 },
    health: { type: Number, default: 100 },
    maxHealth: { type: Number, default: 100 },
    streak: { type: Number, default: 0 },
    lastStreakDate: { type: Date },

    // Daily Login Bonus
    dailyStreak: { type: Number, default: 1 },
    lastDailyClaim: { type: Date, default: null },

    // Inventory
    // Inventory
    inventory: [{
        name: { type: String, required: true },
        cost: Number,
        icon: String,
        category: { type: String, default: 'general' },
        type: { type: String, default: 'static' },
        quantity: { type: Number, default: 1 }
    }],

    // Pet
    petUrl: { type: String },
    avatarUrl: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
