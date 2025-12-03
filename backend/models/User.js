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
    coins: { type: Number, default: 0 },
    health: { type: Number, default: 100 },
    maxHealth: { type: Number, default: 100 },
    streak: { type: Number, default: 0 },
    lastStreakDate: { type: Date },
    // NO BINARY DATA - Only references if needed later
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
