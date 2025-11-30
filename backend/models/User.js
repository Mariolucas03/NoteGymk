const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // ID manual (ej: "user_1") en lugar del automático raro de Mongo
    _id: { type: String, required: true },

    name: { type: String, required: true },
    
    // Email y Pass opcionales para que no te den guerra ahora
    email: { type: String, required: false },
    password: { type: String, required: false },

    // Estadísticas del juego
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    lives: { type: Number, default: 3 },
    level: { type: Number, default: 1 },

    // Historial de eventos (para el calendario del perfil)
    events: { type: Array, default: [] },

    // --- SISTEMA DE MISIONES DIARIAS ---
    missions: { type: Array, default: [] },
    lastDailyReset: { type: String, default: '' }, // Guarda "2023-11-30"

    // --- SISTEMA DE OBJETIVOS (Semanal, Mensual, Anual) ---
    objectives: { type: Array, default: [] },
    
    // Relojes para saber cuándo reiniciar cada tipo
    lastWeeklyReset: { type: String, default: '' },  // Guarda "2023-W48"
    lastMonthlyReset: { type: String, default: '' }, // Guarda "2023-11"
    lastYearlyReset: { type: String, default: '' }   // Guarda "2023"

}, { 
    timestamps: true,
    _id: false // Importante para que Mongo respete tu ID manual
});

module.exports = mongoose.model('User', UserSchema);