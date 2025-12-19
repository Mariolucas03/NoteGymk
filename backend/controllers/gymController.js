const Routine = require('../models/Routine');
const Exercise = require('../models/Exercise');
const WorkoutLog = require('../models/WorkoutLog');
const DailyLog = require('../models/DailyLog');
const levelService = require('../services/levelService');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// 1. OBTENER RUTINAS
const getRoutines = async (req, res) => {
    try {
        const routines = await Routine.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(routines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar rutinas' });
    }
};

// 2. CREAR RUTINA
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

// 3. BORRAR RUTINA
const deleteRoutine = async (req, res) => {
    try {
        await Routine.deleteOne({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Rutina eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando rutina' });
    }
};

// 4. OBTENER EJERCICIOS
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

// 5. CREAR EJERCICIO CUSTOM
const createCustomExercise = async (req, res) => {
    try {
        const { name, muscle } = req.body;
        if (!name || !muscle) {
            res.status(400);
            throw new Error('Faltan datos');
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
        res.status(500).json({ message: 'Error creando ejercicio' });
    }
};

// 6. SEED (Rellenar base de datos)
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en seed' });
    }
};

// 7. GUARDAR LOG DE GYM (ARRAYS - MULTIPLE)
const saveWorkoutLog = async (req, res) => {
    try {
        const { routineId, routineName, duration, exercises } = req.body;

        // 1. Guardar en Historial General (WorkoutLog)
        const log = await WorkoutLog.create({
            user: req.user._id,
            routine: routineId,
            routineName: routineName || 'Entrenamiento Libre',
            duration,
            exercises,
            type: 'gym',
            date: new Date()
        });

        // 2. Guardar en DailyLog (DÍA ACTUAL) - AHORA CON PUSH para permitir varios
        const today = getTodayDateString();

        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                $push: { // USAMOS PUSH PARA AÑADIR A LA LISTA
                    gymWorkouts: {
                        name: routineName,
                        duration: duration,
                        exercises: exercises.map(ex => ({
                            name: ex.name,
                            sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
                        })),
                        timestamp: new Date()
                    }
                }
            },
            { upsert: true }
        );

        res.status(201).json({ message: 'Entrenamiento guardado', log });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error guardando entrenamiento' });
    }
};

// 8. GUARDAR LOG DE DEPORTE (ARRAYS - MULTIPLE)
const saveSportLog = async (req, res) => {
    try {
        const { name, time, intensity, distance } = req.body;

        // 1. Historial General
        const log = await WorkoutLog.create({
            user: req.user._id,
            routineName: name,
            duration: time * 60,
            intensity,
            distance,
            type: 'sport',
            date: new Date()
        });

        // 2. Daily Log
        const today = getTodayDateString();

        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                $push: { // USAMOS PUSH PARA AÑADIR A LA LISTA
                    sportWorkouts: {
                        routineName: name,
                        duration: time,
                        intensity,
                        distance,
                        timestamp: new Date()
                    }
                }
            },
            { upsert: true }
        );

        const result = await levelService.addRewards(req.user._id, 30, 10);

        res.status(201).json({
            message: 'Deporte registrado',
            log,
            user: result.user,
            leveledUp: result.leveledUp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registrando deporte' });
    }
};

// 9. CALCULAR PROGRESO SEMANAL (Widget)
const getWeeklyStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const today = new Date();
        const diffToMonday = today.getDay() === 0 ? -6 : 1 - today.getDay();

        const startOfThisWeek = new Date(today);
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(today.getDate() + diffToMonday);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        const logs = await WorkoutLog.find({
            user: userId,
            type: 'gym',
            date: { $gte: startOfLastWeek }
        });

        let currentVolume = 0;
        let lastVolume = 0;

        logs.forEach(log => {
            const logDate = new Date(log.date);
            let logTotal = 0;
            if (log.exercises) {
                log.exercises.forEach(ex => {
                    if (ex.sets) {
                        ex.sets.forEach(s => {
                            logTotal += (s.weight || 0) * (s.reps || 0);
                        });
                    }
                });
            }
            if (logDate >= startOfThisWeek) {
                currentVolume += logTotal;
            } else {
                lastVolume += logTotal;
            }
        });

        let percentage = 0;
        if (lastVolume > 0) {
            percentage = ((currentVolume - lastVolume) / lastVolume) * 100;
        } else if (currentVolume > 0) {
            percentage = 100;
        }

        res.json({
            currentVolume,
            lastVolume,
            percentage: Math.round(percentage)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error calculando stats semanales' });
    }
};

// 10. DETALLE POR MÚSCULO (Gráfica)
const getMuscleProgress = async (req, res) => {
    try {
        const { muscle } = req.query;
        const userId = req.user._id;

        const exercises = await Exercise.find({
            muscle: muscle,
            $or: [{ user: userId }, { isCustom: false }, { user: null }]
        }).select('name');

        const exerciseNames = exercises.map(e => e.name);

        const logs = await WorkoutLog.find({
            user: userId,
            'exercises.name': { $in: exerciseNames }
        }).sort({ date: 1 });

        const history = logs.map(log => {
            let sessionVolume = 0;
            log.exercises.forEach(ex => {
                if (exerciseNames.includes(ex.name)) {
                    ex.sets.forEach(s => {
                        sessionVolume += (s.weight || 0) * (s.reps || 0);
                    });
                }
            });
            if (sessionVolume > 0) return { date: log.date, volume: sessionVolume };
            return null;
        }).filter(item => item !== null);

        res.json(history.slice(-10));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando progreso muscular' });
    }
};

// 11. OBTENER HISTORIAL (Relleno Inteligente y PR)
const getRoutineHistory = async (req, res) => {
    try {
        const { exercises } = req.body;
        const userId = req.user._id;
        const stats = {};

        const calc1RM = (w, r) => {
            if (r === 0) return 0;
            if (r === 1) return w;
            return Math.round(w / (1.0278 - 0.0278 * r));
        };

        const logs = await WorkoutLog.find({
            user: userId,
            'exercises.name': { $in: exercises }
        }).sort({ date: 1 });

        logs.forEach(log => {
            log.exercises.forEach(ex => {
                if (exercises.includes(ex.name)) {
                    // Inicializar si no existe
                    if (!stats[ex.name]) {
                        stats[ex.name] = {
                            lastSets: [],
                            bestSet: { weight: 0, reps: 0, value1RM: 0 }
                        };
                    }

                    // 1. Guardar última sesión
                    const validSets = ex.sets.map(s => ({ weight: s.weight, reps: s.reps }));
                    if (validSets.length > 0) {
                        stats[ex.name].lastSets = validSets;
                    }

                    // 2. Calcular PR (Basado en 1RM pero guardando Kg x Reps)
                    ex.sets.forEach(set => {
                        const rm = calc1RM(set.weight, set.reps);
                        // Si este set es mejor que el actual record...
                        if (rm > stats[ex.name].bestSet.value1RM) {
                            stats[ex.name].bestSet = {
                                weight: set.weight,
                                reps: set.reps,
                                value1RM: rm
                            };
                        }
                    });
                }
            });
        });

        res.json(stats);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo historial' });
    }
};

// 12. HERRAMIENTA DE TEST (Seed INTELIGENTE)
const seedFakeHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Buscar TODOS los ejercicios disponibles (Sistema + Usuario)
        const allExercises = await Exercise.find({
            $or: [{ user: userId }, { isCustom: false }, { user: null }]
        });

        const targetNames = allExercises.map(e => e.name);

        console.log(`Inyectando historial doble para ${targetNames.length} ejercicios...`);

        // 2. Sesión 1: Hace 15 días (Peso bajo)
        const dateOld = new Date();
        dateOld.setDate(dateOld.getDate() - 15);

        await WorkoutLog.create({
            user: userId,
            type: 'gym',
            routineName: 'Entreno Inicio (Test)',
            duration: 3000,
            date: dateOld,
            exercises: targetNames.map(name => ({
                name: name,
                sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }]
            }))
        });

        // 3. Sesión 2: Hace 7 días (Progreso)
        const dateRecent = new Date();
        dateRecent.setDate(dateRecent.getDate() - 7);

        await WorkoutLog.create({
            user: userId,
            type: 'gym',
            routineName: 'Entreno Progreso (Test)',
            duration: 3500,
            date: dateRecent,
            exercises: targetNames.map(name => ({
                name: name,
                sets: [{ weight: 25, reps: 10 }, { weight: 30, reps: 8 }] // ¡Más peso!
            }))
        });

        res.json({ message: `✅ Gráficas listas. Creadas 2 sesiones para ${targetNames.length} ejercicios.` });
    } catch (error) {
        console.error("SEED ERROR:", error);
        res.status(500).json({ message: 'Error en seed: ' + error.message });
    }
};

// 13. ESTADÍSTICAS DETALLADAS DE UN EJERCICIO
const getExerciseHistory = async (req, res) => {
    try {
        const { exerciseName } = req.query;
        const userId = req.user._id;

        if (!exerciseName) return res.status(400).json({ message: 'Falta el nombre del ejercicio' });

        // Buscamos logs que contengan ese ejercicio, ordenados por fecha
        const logs = await WorkoutLog.find({
            user: userId,
            'exercises.name': exerciseName
        }).sort({ date: 1 });

        const data = logs.map(log => {
            // Buscamos el ejercicio dentro del log
            const exData = log.exercises.find(e => e.name === exerciseName);
            if (!exData) return null;

            // Calculamos el mejor 1RM de ESA sesión
            let max1RM = 0;
            let maxWeight = 0;

            exData.sets.forEach(s => {
                const w = s.weight || 0;
                const r = s.reps || 0;
                if (w > maxWeight) maxWeight = w; // Peso máximo levantado

                // Fórmula Epley
                const rm = r === 1 ? w : w * (1 + r / 30);
                if (rm > max1RM) max1RM = rm;
            });

            return {
                date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                pr: Math.round(max1RM),
                weight: maxWeight
            };
        }).filter(item => item !== null);

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando stats' });
    }
};

// 14. ESTADO DEL CUERPO (RPG AVATAR)
const getBodyStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        // Miramos los últimos 30 días (para que el avatar "se apague" si dejas de entrenar)
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);

        // 1. Obtener todos los logs recientes
        const logs = await WorkoutLog.find({
            user: userId,
            type: 'gym',
            date: { $gte: sinceDate }
        });

        // 2. Obtener mapa de ejercicios y sus músculos
        const allExercises = await Exercise.find({
            $or: [{ user: userId }, { isCustom: false }, { user: null }]
        });

        // Crear diccionario: "Press Banca" -> "Pecho"
        const exerciseToMuscle = {};
        allExercises.forEach(ex => {
            exerciseToMuscle[ex.name] = ex.muscle;
        });

        // 3. Sumar Sets por Músculo
        const muscleStats = {
            'Pecho': 0, 'Espalda': 0, 'Pierna': 0,
            'Hombro': 0, 'Bíceps': 0, 'Tríceps': 0, 'Abdomen': 0
        };

        logs.forEach(log => {
            log.exercises.forEach(ex => {
                const muscle = exerciseToMuscle[ex.name];
                if (muscle && muscleStats[muscle] !== undefined) {
                    // Sumamos el número de series (sets) como indicador de "trabajo"
                    // Si prefieres volumen (kg), cambia ex.sets.length por el cálculo de peso
                    muscleStats[muscle] += ex.sets.length;
                }
            });
        });

        res.json(muscleStats);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando estado del cuerpo' });
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
    saveSportLog,
    getWeeklyStats,
    getMuscleProgress,
    getRoutineHistory,
    seedFakeHistory,
    getExerciseHistory,
    getBodyStatus
};