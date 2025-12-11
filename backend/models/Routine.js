const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Ej: "Press Banca"
    muscle: { type: String, required: true }, // Ej: "Pecho"
    sets: { type: Number, default: 3 },     // Series objetivo
    reps: { type: String, default: '10-12' }, // Reps objetivo (String por si pones 'Fallo')
    targetWeight: { type: Number, default: 0 } // Peso meta (opcional)
});

const routineSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // Ej: "Push Day"
    exercises: [exerciseSchema],

    // Stats rápidos
    lastPerformed: { type: Date },
    timesCompleted: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Routine', routineSchema);