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
    // --- ESTO ES LO QUE FALTABA PARA QUE FUNCIONE LA SEPARACIÓN ---
    type: {
        type: String,
        enum: ['gym', 'sport'],
        default: 'gym' // Por defecto todo es gym salvo que digamos lo contrario
    },
    intensity: { type: String }, // Solo para sport
    distance: { type: Number },  // Solo para sport
    // ------------------------------------------------------------
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

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);