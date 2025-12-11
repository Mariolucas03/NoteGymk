const Routine = require('../models/Routine');
const Exercise = require('../models/Exercise');

// --- RUTINAS ---
const getRoutines = async (req, res) => {
    try {
        const routines = await Routine.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(routines);
    } catch (error) {
        res.status(500).json({ message: 'Error al cargar rutinas' });
    }
};

const createRoutine = async (req, res) => {
    try {
        const { name, exercises } = req.body;
        const routine = await Routine.create({
            user: req.user._id,
            name,
            exercises // Guardamos el array de ejercicios seleccionados
        });
        res.status(201).json(routine);
    } catch (error) {
        res.status(500).json({ message: 'Error creando rutina' });
    }
};

const deleteRoutine = async (req, res) => {
    try {
        await Routine.deleteOne({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Rutina eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando rutina' });
    }
};

// --- EJERCICIOS (CATÁLOGO) ---

// 1. Obtener lista (con filtro opcional)
const getExercises = async (req, res) => {
    try {
        const { muscle } = req.query;
        let query = {};
        if (muscle && muscle !== 'Todos') query.muscle = muscle;

        const exercises = await Exercise.find(query).sort({ name: 1 });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ message: 'Error cargando ejercicios' });
    }
};

// 2. SEED (Llenar base de datos con básicos si está vacía)
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
            { name: 'Crunch Abdominal', muscle: 'Abs', equipment: 'Suelo' },
            { name: 'Plancha', muscle: 'Abs', equipment: 'Suelo' },
        ];

        await Exercise.insertMany(basics);
        res.json({ message: 'Ejercicios base creados' });
    } catch (error) {
        res.status(500).json({ message: 'Error en seed' });
    }
};

// ... import WorkoutLog ... (asegúrate de tenerlo importado arriba)
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User'); // Necesitamos el usuario para darle XP

// @desc    Guardar un entrenamiento terminado
// @route   POST /api/gym/log
const saveWorkoutLog = async (req, res) => {
    try {
        const { routineId, routineName, duration, exercises } = req.body;

        // 1. Calcular Volumen Total (para dar XP)
        // Volumen = Sets * Reps * Kg
        let totalVolume = 0;
        let totalReps = 0;

        exercises.forEach(ex => {
            ex.sets.forEach(set => {
                if (set.completed) {
                    totalVolume += (set.weight || 0) * (set.reps || 0);
                    totalReps += (set.reps || 0);
                }
            });
        });

        // 2. Fórmula de Gamificación Simple
        // 10 XP por minuto + 1 XP por cada 100kg levantados
        const xpEarned = Math.floor((duration / 60) * 10) + Math.floor(totalVolume / 100);
        const coinsEarned = Math.floor(totalReps / 5); // 1 moneda cada 5 reps

        // 3. Crear el Log
        const log = await WorkoutLog.create({
            user: req.user._id,
            routine: routineId,
            routineName,
            duration,
            exercises,
            earnedXP: xpEarned,
            earnedCoins: coinsEarned
        });

        // 4. Actualizar Usuario (Darle su recompensa)
        const user = await User.findById(req.user._id);
        user.currentXP += xpEarned;
        user.coins += coinsEarned;

        // Subida de nivel básica
        if (user.currentXP >= user.nextLevelXP) {
            user.level += 1;
            user.currentXP -= user.nextLevelXP;
            user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5);
        }

        await user.save();

        res.status(201).json({
            message: 'Entrenamiento guardado',
            xp: xpEarned,
            coins: coinsEarned,
            user // Devolvemos usuario actualizado para el frontend
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error guardando entrenamiento' });
    }
};

// NO OLVIDES AÑADIRLO AL EXPORT AL FINAL DEL ARCHIVO:
module.exports = {
    getRoutines,
    createRoutine,
    deleteRoutine,
    getExercises,
    seedExercises,
    saveWorkoutLog // <--- NUEVO
};

