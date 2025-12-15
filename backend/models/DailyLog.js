const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema({
    // Vinculación obligatoria al usuario
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    // Fecha en formato YYYY-MM-DD
    date: { type: String, required: true },

    // --- TUS CAMPOS ---
    mood: { type: String, default: null },
    weight: { type: Number },
    sleepHours: { type: Number },
    steps: { type: Number },
    totalKcal: { type: Number, default: 0 },

}, { timestamps: true });

// --- LA CLAVE PARA ARREGLARLO ---
// Esto asegura que la combinación Usuario + Fecha sea ÚNICA en la base de datos.
// Evita duplicados y mezclas extrañas.
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);