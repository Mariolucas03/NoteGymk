const Routine = require('../models/Routine');
const Exercise = require('../models/Exercise');
const WorkoutLog = require('../models/WorkoutLog');
const DailyLog = require('../models/DailyLog');
const User = require('../models/User');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getRoutines = async (req, res) => {
    try {
        const routines = await Routine.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(routines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar rutinas' });
    }
};

const createRoutine = async (req, res) => {
    try {
        const { name, exercises } = req.body;
        const routine = await Routine.create({ user: req.user._id, name, exercises });
        res.status(201).json(routine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando rutina' });
    }
};

const deleteRoutine = async (req, res) => {
    try {
        await Routine.deleteOne({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Rutina eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando rutina' });
    }
};

const getAllExercises = async (req, res) => {
    try {
        const { muscle } = req.query;
        let query = {};
        if (muscle && muscle !== 'Todos') query.muscle = muscle;
        const exercises = await Exercise.find(query).sort({ name: 1 });
        res.json(exercises);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando ejercicios' });
    }
};

const createCustomExercise = async (req, res) => {
    try {
        const { name, muscle } = req.body;
        if (!name || !muscle) { res.status(400); throw new Error('Faltan datos'); }
        const exercise = await Exercise.create({ name, muscle, category: 'strength', user: req.user._id, isCustom: true });
        res.status(201).json(exercise);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando ejercicio' });
    }
};

const seedExercises = async (req, res) => {
    try {
        const count = await Exercise.countDocuments();
        if (count > 0) return res.json({ message: 'Ya existen ejercicios' });
        const basics = [
            { name: 'Press de Banca', muscle: 'Pecho', equipment: 'Barra' },
            { name: 'Sentadilla', muscle: 'Pierna', equipment: 'Barra' },
            { name: 'Peso Muerto', muscle: 'Espalda', equipment: 'Barra' },
            { name: 'Press Militar', muscle: 'Hombro', equipment: 'Barra' },
            { name: 'Dominadas', muscle: 'Espalda', equipment: 'Peso Corporal' },
            { name: 'Remo con Barra', muscle: 'Espalda', equipment: 'Barra' },
            { name: 'Curl de Bíceps', muscle: 'Bíceps', equipment: 'Barra' },
            { name: 'Fondos', muscle: 'Tríceps', equipment: 'Peso Corporal' }
        ];
        await Exercise.insertMany(basics);
        res.json({ message: 'Ejercicios base creados' });
    } catch (error) { console.error(error); res.status(500).json({ message: 'Error en seed' }); }
};

// --- LOGS DE ENTRENAMIENTO (MODIFICADO: SIN RECOMPENSAS) ---
const saveWorkoutLog = async (req, res) => {
    try {
        const { routineId, routineName, duration, exercises } = req.body;

        // 1. Guardar en Historial General (Sin XP ni Coins)
        const log = await WorkoutLog.create({
            user: req.user._id,
            routine: routineId,
            routineName: routineName || 'Entrenamiento Libre',
            duration,
            exercises,
            type: 'gym',
            earnedXP: 0,    // <--- CERO
            earnedCoins: 0, // <--- CERO
            date: new Date()
        });

        // 2. ACTUALIZAR WIDGET DE HOY (Sin sumar nada a gains)
        const today = getTodayDateString();
        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                gymWorkout: {
                    name: routineName,
                    duration: duration,
                    earnedXP: 0,    // <--- CERO
                    earnedCoins: 0, // <--- CERO
                    exercises: exercises.map(ex => ({
                        name: ex.name,
                        sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
                    }))
                }
                // ELIMINADO: $inc de gains.xp y gains.coins
            },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Entrenamiento guardado', log });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error guardando entrenamiento' });
    }
};

const saveSportLog = async (req, res) => {
    try {
        const { name, time, intensity, distance } = req.body;

        // Mantenemos recompensas en deporte o las quitamos también? 
        // Si quieres quitarlo en TODO, cambia estos valores a 0 también.
        const log = await WorkoutLog.create({
            user: req.user._id,
            routineName: name,
            duration: time * 60,
            intensity: intensity,
            distance: distance || 0,
            type: 'sport',
            date: new Date(),
            earnedXP: 30, // Deporte sigue dando algo? O pon 0 si quieres
            earnedCoins: 10
        });

        const today = getTodayDateString();
        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                sportWorkout: {
                    routineName: name,
                    duration: time,
                    intensity: intensity,
                    distance: distance || 0,
                    caloriesBurned: 0
                },
                $inc: { 'gains.xp': 30, 'gains.coins': 10 }
            },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Deporte registrado', log });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registrando deporte' });
    }
};

module.exports = {
    getRoutines, createRoutine, deleteRoutine, getAllExercises,
    createCustomExercise, seedExercises, saveWorkoutLog, saveSportLog
};