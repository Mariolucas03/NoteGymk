const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema({
    // Vinculación obligatoria al usuario
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    // Fecha en formato YYYY-MM-DD
    date: { type: String, required: true },

    // --- DATOS SIMPLES ---
    mood: { type: String, default: null },
    weight: { type: Number },
    sleepHours: { type: Number },
    steps: { type: Number },
    totalKcal: { type: Number, default: 0 },
    streakCurrent: { type: Number },

    // --- DATOS COMPLEJOS ---

    nutrition: {
        totalKcal: { type: Number, default: 0 },
        breakfast: { type: Number, default: 0 },
        lunch: { type: Number, default: 0 },
        dinner: { type: Number, default: 0 },
        snacks: { type: Number, default: 0 },
        merienda: { type: Number, default: 0 } // <--- ✅ NUEVO CAMPO
    },

    sportWorkout: {
        routineName: String,
        distance: Number,
        intensity: String,
        duration: Number,
        caloriesBurned: Number
    },

    gymWorkout: {
        name: String,
        exercises: [{
            name: String,
            sets: [{ weight: Number, reps: Number }]
        }]
    },

    missionStats: {
        completed: { type: Number, default: 0 },
        total: { type: Number, default: 3 },
        listCompleted: [{
            title: String,
            coinReward: Number,
            xpReward: Number,
            frequency: String,
            type: String
        }]
    },

    gains: {
        coins: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        lives: { type: Number, default: 0 }
    }

}, { timestamps: true });

// Índice único
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);