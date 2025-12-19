const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'daily'
    },
    type: {
        type: String,
        enum: ['habit', 'temporal'],
        default: 'habit'
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'epic'],
        default: 'easy'
    },

    // Recompensas
    xpReward: { type: Number, default: 10 },
    coinReward: { type: Number, default: 5 },         // Moneda Real
    gameCoinReward: { type: Number, default: 50 },    // 🔥 Fichas de Juego

    progress: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mission', missionSchema);