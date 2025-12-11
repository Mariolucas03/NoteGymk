const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
    reps: { type: Number, required: true },
    weight: { type: Number, required: true }, // kg
    completed: { type: Boolean, default: true }
});

const workoutLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routine: { type: mongoose.Schema.Types.ObjectId, ref: 'Routine' }, // Referencia a la plantilla
    routineName: { type: String }, // Guardamos nombre por si borras la rutina original

    date: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 }, // minutos

    exercises: [{
        name: { type: String, required: true },
        sets: [setSchema] // Aquí guardamos: 10 reps con 50kg, 8 reps con 55kg...
    }],

    // Recompensas ganadas en esta sesión
    earnedXP: { type: Number, default: 0 },
    earnedCoins: { type: Number, default: 0 }
});

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);