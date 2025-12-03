const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, default: 'fija' }, // Deprecated in favor of isRecurring + frequency
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'annual'], default: 'daily' },
    isRecurring: { type: Boolean, default: true }, // true = Fija, false = Temporal
    difficulty: { type: String, enum: ['facil', 'media', 'dificil', 'muy_dificil'], default: 'facil' },
    xpReward: { type: Number, default: 10 },
    coinReward: { type: Number, default: 5 },
    expiresAt: { type: Date },
    isCompleted: { type: Boolean, default: false },
    targetValue: { type: Number, default: 1 },
    currentValue: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mission', missionSchema);
