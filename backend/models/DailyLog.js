const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Formato "YYYY-MM-DD" para buscar fácil

    // WIDGETS DATA
    mood: { type: String, enum: ['happy', 'neutral', 'sad', null], default: null },
    weight: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 },
    water: { type: Number, default: 0 }, // Vasos de agua (extra común)
    steps: { type: Number, default: 0 },

    // RESUMEN NUTRICIONAL
    totalKcal: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

// Índice para que la búsqueda por usuario+fecha sea instantánea
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);