const mongoose = require('mongoose');

const workoutLogSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    routine: { // ID de la rutina (solo para pesas)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine'
    },
    routineName: {
        type: String,
        required: true
    },
    duration: { // Segundos
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['gym', 'sport'],
        default: 'gym' // Por defecto todo es gym salvo que digamos lo contrario
    },
    intensity: { type: String, default: 'Normal' },
    distance: { type: Number },  // Solo para sport
    caloriesBurned: { type: Number, default: 0 },
    exercises: [{
        name: String,
        sets: [{
            weight: Number,
            reps: Number,
            completed: Boolean
        }]
    }],
    earnedXP: { type: Number, default: 0 },
    earnedCoins: { type: Number, default: 0 },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 🔥 ÍNDICES PARA RENDIMIENTO 🔥

// 1. Índice compuesto: Busca logs de un usuario específico ordenados por fecha descendente
// (Acelera la carga del historial general)
workoutLogSchema.index({ user: 1, date: -1 });

// 2. Índice para gráficas específicas: Busca por usuario y filtra por nombre de ejercicio dentro del array
// (Acelera el ProfileStats al buscar "Press Banca", por ejemplo)
workoutLogSchema.index({ user: 1, "exercises.name": 1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);