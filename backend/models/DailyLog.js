const mongoose = require('mongoose');

// Sub-esquemas existentes...
const SetSchema = new mongoose.Schema({
    weight: { type: Number, required: true },
    reps: { type: Number, required: true }
}, { _id: false });

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: [SetSchema]
}, { _id: false });

// 🔥 ACTUALIZADO: Esquema de Misión Histórica
const CompletedMissionSchema = new mongoose.Schema({
    title: { type: String, required: true },

    // Recompensas
    xpReward: { type: Number, default: 0 },
    coinReward: { type: Number, default: 0 },
    gameCoinReward: { type: Number, default: 0 },

    // Meta-datos
    frequency: { type: String },
    difficulty: { type: String },
    type: { type: String },

    // 🔥 NUEVOS CAMPOS PARA FALLOS
    failed: { type: Boolean, default: false }, // ¿Fue completada o fallida?
    hpLoss: { type: Number, default: 0 }       // ¿Cuánta vida costó?
}, { _id: false });

// Esquemas de deporte y gym...
const SportSchema = new mongoose.Schema({
    routineName: String,
    distance: Number,
    intensity: String,
    duration: Number,
    caloriesBurned: Number,
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const GymSessionSchema = new mongoose.Schema({
    name: String,
    duration: Number,
    earnedXP: { type: Number, default: 0 },
    earnedCoins: { type: Number, default: 0 },
    exercises: [ExerciseSchema],
    timestamp: { type: Date, default: Date.now }
}, { _id: false });


const dailyLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: String, required: true },

    mood: { type: String, default: null },
    weight: { type: Number, default: null },
    sleepHours: { type: Number, default: null },
    steps: { type: Number, default: 0 },
    streakCurrent: { type: Number, default: 0 },

    nutrition: {
        totalKcal: { type: Number, default: 0 },
        breakfast: { type: Number, default: 0 },
        lunch: { type: Number, default: 0 },
        dinner: { type: Number, default: 0 },
        snacks: { type: Number, default: 0 },
        merienda: { type: Number, default: 0 }
    },

    sportWorkouts: [SportSchema],
    gymWorkouts: [GymSessionSchema],

    missionStats: {
        completed: { type: Number, default: 0 },
        total: { type: Number, default: 3 },
        listCompleted: [CompletedMissionSchema] // Array mixto (Completadas + Fallidas)
    },

    gains: {
        coins: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        lives: { type: Number, default: 0 } // Vidas perdidas ese día (opcional)
    }

}, { timestamps: true });

dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);