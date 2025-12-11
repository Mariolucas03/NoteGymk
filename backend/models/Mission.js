const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true },

    // FRECUENCIA: Define el plazo (El "Cuándo")
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'daily'
    },

    // TIPO: Define el comportamiento al acabar el plazo (El "Qué pasa luego")
    // - habit: Se resetea y vuelve a aparecer (Fija)
    // - temporal: Si se acaba el plazo, desaparece (se borra/archiva)
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

    // Recompensas y Castigos
    xpReward: { type: Number, default: 10 },
    coinReward: { type: Number, default: 5 },
    lifePenalty: { type: Number, default: 0 }, // Vidas que pierdes si fallas

    progress: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },

    // Fecha crítica para calcular si ha caducado el plazo
    lastUpdated: { type: Date, default: Date.now },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mission', missionSchema);