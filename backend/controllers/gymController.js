const Routine = require('../models/Routine');
const Exercise = require('../models/Exercise');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');

// --- RUTINAS ---

// Obtener todas las rutinas del usuario
const getRoutines = async (req, res) => {
    try {
        const routines = await Routine.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(routines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar rutinas' });
    }
};

// Crear una nueva rutina
const createRoutine = async (req, res) => {
    try {
        const { name, exercises } = req.body;
        const routine = await Routine.create({
            user: req.user._id,
            name,
            exercises
        });
        res.status(201).json(routine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando rutina' });
    }
};

// Borrar rutina
const deleteRoutine = async (req, res) => {
    try {
        await Routine.deleteOne({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Rutina eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando rutina' });
    }
};

// --- EJERCICIOS ---

// Obtener lista de ejercicios
const getAllExercises = async (req, res) => {
    try {
        const { muscle } = req.query;
        let query = {};
        if (muscle && muscle !== 'Todos') {
            query.muscle = muscle;
        }
        const exercises = await Exercise.find(query).sort({ name: 1 });
        res.json(exercises);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando ejercicios' });
    }
};

// Crear ejercicio personalizado
const createCustomExercise = async (req, res) => {
    try {
        const { name, muscle } = req.body;
        if (!name || !muscle) {
            res.status(400);
            throw new Error('Nombre y grupo muscular son obligatorios');
        }
        const exercise = await Exercise.create({
            name,
            muscle,
            category: 'strength',
            user: req.user._id,
            isCustom: true
        });
        res.status(201).json(exercise);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando ejercicio personalizado' });
    }
};

// Seed (rellenar base de datos)
const seedExercises = async (req, res) => {
    try {
        const count = await Exercise.countDocuments();
        if (count > 0) return res.json({ message: 'Ya existen ejercicios' });

        const basics = [
            { name: 'Press de Banca', muscle: 'Pecho', equipment: 'Barra' },
            { name: 'Press Inclinado', muscle: 'Pecho', equipment: 'Mancuernas' },
            { name: 'Aperturas', muscle: 'Pecho', equipment: 'Polea' },
            { name: 'Dominadas', muscle: 'Espalda', equipment: 'Peso Corporal' },
            { name: 'Remo con Barra', muscle: 'Espalda', equipment: 'Barra' },
            { name: 'Jalón al Pecho', muscle: 'Espalda', equipment: 'Máquina' },
            { name: 'Sentadilla', muscle: 'Pierna', equipment: 'Barra' },
            { name: 'Prensa', muscle: 'Pierna', equipment: 'Máquina' },
            { name: 'Extensiones', muscle: 'Pierna', equipment: 'Máquina' },
            { name: 'Press Militar', muscle: 'Hombro', equipment: 'Barra' },
            { name: 'Elevaciones Laterales', muscle: 'Hombro', equipment: 'Mancuernas' },
            { name: 'Curl de Bíceps', muscle: 'Bíceps', equipment: 'Barra' },
            { name: 'Extensiones Tríceps', muscle: 'Tríceps', equipment: 'Polea' },
            { name: 'Crunch Abdominal', muscle: 'Abdomen', equipment: 'Suelo' },
            { name: 'Plancha', muscle: 'Abdomen', equipment: 'Suelo' },
        ];

        await Exercise.insertMany(basics);
        res.json({ message: 'Ejercicios base creados' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en seed' });
    }
};

// --- LOGS DE ENTRENAMIENTO (PESAS) ---

const saveWorkoutLog = async (req, res) => {
    try {
        const { routineId, routineName, duration, exercises } = req.body;

        const log = await WorkoutLog.create({
            user: req.user._id,
            routine: routineId,
            routineName: routineName || 'Entrenamiento Libre',
            duration,
            exercises,
            type: 'gym', // <--- IMPORTANTE: Forzamos que sea tipo GYM
            earnedXP: 0,
            earnedCoins: 0,
            date: new Date()
        });

        res.status(201).json({ message: 'Entrenamiento guardado', log });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error guardando entrenamiento' });
    }
};

// --- LOGS DE DEPORTE (CARDIO/ACTIVIDAD) ---

const saveSportLog = async (req, res) => {
    try {
        const { name, time, intensity, distance } = req.body;

        const log = await WorkoutLog.create({
            user: req.user._id,
            routineName: name, // Usamos el nombre de la actividad
            duration: time,
            intensity: intensity,
            distance: distance || 0,
            type: 'sport', // <--- IMPORTANTE: Forzamos que sea tipo SPORT
            date: new Date(),
            earnedXP: 0,
            earnedCoins: 0
        });

        res.status(201).json({ message: 'Deporte registrado', log });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registrando deporte' });
    }
};

module.exports = {
    getRoutines,
    createRoutine,
    deleteRoutine,
    getAllExercises,
    createCustomExercise,
    seedExercises,
    saveWorkoutLog,
    saveSportLog
};