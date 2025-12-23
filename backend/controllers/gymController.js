const Routine = require('../models/Routine');
const Exercise = require('../models/Exercise');
const WorkoutLog = require('../models/WorkoutLog');
const DailyLog = require('../models/DailyLog');
const levelService = require('../services/levelService');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Configuración Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// 7. GUARDAR LOG DE GYM (CON CÁLCULO IA DE CALORÍAS + INTENSIDAD)
const saveWorkoutLog = async (req, res) => {
    try {
        const { routineId, routineName, duration, exercises, intensity } = req.body;

        // 1. OBTENER PESO REAL
        const lastWeightLog = await DailyLog.findOne({
            user: req.user._id,
            weight: { $gt: 0 }
        }).sort({ date: -1 });
        const userWeight = lastWeightLog ? lastWeightLog.weight : 75;

        let caloriesBurned = 0;

        // 2. PREPARAR DATOS PARA LA IA
        const exercisesDescription = exercises.map(ex => {
            const setsDesc = ex.sets.map(s => `${s.weight}kg x ${s.reps}`).join(', ');
            return `- ${ex.name}: [${setsDesc}]`;
        }).join('\n');

        let intensityContext = "";
        if (intensity === 'Baja') intensityContext = "Estilo Powerlifting/Fuerza. Descansos largos (3-5 min). Frecuencia cardíaca media-baja. Gasto calórico MENOR.";
        if (intensity === 'Media') intensityContext = "Estilo Hipertrofia estándar. Descansos medios (1-2 min). Ritmo constante.";
        if (intensity === 'Alta') intensityContext = "Estilo Metabólico/Superseries/Crossfit. Descansos mínimos. Frecuencia cardíaca alta. Gasto calórico MAYOR.";

        // --- CÁLCULO CON GEMINI ---
        try {
            console.log(`🤖 Gym IA: ${duration}s, ${userWeight}kg, Intensidad: ${intensity}`);

            // CORREGIDO: Modelo actualizado
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
                Calcula las calorías quemadas en esta sesión de pesas.
                
                DATOS CLAVE:
                - Peso Atleta: ${userWeight} kg (DATO CRÍTICO)
                - Duración: ${Math.floor(duration / 60)} minutos
                - Intensidad Declarada: ${intensity} (${intensityContext})
                
                RUTINA REALIZADA:
                ${exercisesDescription}

                INSTRUCCIONES:
                - Usa el peso corporal y la intensidad para ajustar el cálculo.
                - Si es intensidad "Baja" (descansos largos), reduce la estimación considerablemente.
                - Si es "Alta", auméntala.
                
                Responde ÚNICAMENTE JSON: { "calories": numero_entero }
            `;

            // 🔥 CORRECCIÓN APLICADA: FORZAR JSON 🔥
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const response = await result.response;
            const data = JSON.parse(response.text());

            caloriesBurned = Math.round(data.calories);
            console.log(`✅ Gemini Gym calculó: ${caloriesBurned} kcal`);

        } catch (aiError) {
            console.error("⚠️ Fallo IA Gym:", aiError.message);
            // Plan B ajustado por intensidad
            const durationMin = duration / 60;
            let factor = 5;
            if (intensity === 'Baja') factor = 3.5;
            if (intensity === 'Alta') factor = 7;
            caloriesBurned = Math.round(durationMin * factor);
        }

        // 3. Guardar en Historial General
        const log = await WorkoutLog.create({
            user: req.user._id,
            routine: routineId,
            routineName: routineName || 'Entrenamiento Libre',
            duration,
            exercises,
            type: 'gym',
            intensity: intensity || 'Media',
            caloriesBurned,
            date: new Date()
        });

        // 4. Guardar en DailyLog
        const today = getTodayDateString();

        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                $push: {
                    gymWorkouts: {
                        name: routineName,
                        duration: duration,
                        caloriesBurned: caloriesBurned,
                        intensity: intensity || 'Media',
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

        const result = await levelService.addRewards(req.user._id, 50, 15);

        res.status(201).json({
            message: `Entreno guardado: ${caloriesBurned} kcal`,
            log,
            user: result.user,
            leveledUp: result.leveledUp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error guardando entrenamiento' });
    }
};

// 8. GUARDAR LOG DE DEPORTE (CON CÁLCULO IA Y PESO REAL)
const saveSportLog = async (req, res) => {
    try {
        const { name, time, intensity, distance } = req.body;

        const lastWeightLog = await DailyLog.findOne({
            user: req.user._id,
            weight: { $gt: 0 }
        }).sort({ date: -1 });

        const userWeight = lastWeightLog ? lastWeightLog.weight : 75;

        let caloriesBurned = 0;

        // --- CÁLCULO CON GEMINI ---
        try {
            console.log(`🤖 Preguntando a Gemini... Actividad: ${name}, ${time} min, ${intensity}, Peso: ${userWeight}kg`);

            // CORREGIDO: Modelo actualizado
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
                Actúa como un entrenador deportivo fisiólogo.
                Calcula las calorías quemadas para la siguiente actividad.
                Sé preciso considerando el peso corporal (factor clave).

                DATOS:
                - Actividad: "${name}"
                - Duración: ${time} minutos
                - Intensidad: ${intensity}
                - Peso del Atleta: ${userWeight} kg
                - Distancia (opcional): ${distance || 'No especificada'}

                Responde ÚNICAMENTE con este JSON: 
                { "calories": numero_entero_estimado }
            `;

            // 🔥 CORRECCIÓN APLICADA: FORZAR JSON 🔥
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const response = await result.response;
            const data = JSON.parse(response.text());

            caloriesBurned = Math.round(data.calories);
            console.log(`✅ Gemini calculó: ${caloriesBurned} kcal (basado en ${userWeight}kg)`);

        } catch (aiError) {
            console.error("⚠️ Fallo IA Calorías, usando fórmula matemática de respaldo:", aiError.message);
            // Plan B: Fórmula MET aproximada
            const mets = intensity === 'Alta' ? 10 : intensity === 'Media' ? 7 : 4;
            caloriesBurned = Math.round((mets * 3.5 * userWeight / 200) * time);
        }

        // 2. Historial General
        const log = await WorkoutLog.create({
            user: req.user._id,
            routineName: name,
            duration: time * 60,
            intensity,
            distance,
            type: 'sport',
            caloriesBurned: caloriesBurned,
            date: new Date()
        });

        // 3. Daily Log
        const today = getTodayDateString();

        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                $push: {
                    sportWorkouts: {
                        routineName: name,
                        duration: time,
                        intensity,
                        distance,
                        caloriesBurned: caloriesBurned,
                        timestamp: new Date()
                    }
                }
            },
            { upsert: true }
        );

        const result = await levelService.addRewards(req.user._id, 30, 10);

        res.status(201).json({
            message: `Registrado: ${caloriesBurned} kcal`,
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
                sets: [{ weight: 25, reps: 10 }, { weight: 30, reps: 8 }]
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

        const logs = await WorkoutLog.find({
            user: userId,
            'exercises.name': exerciseName
        }).sort({ date: 1 });

        const data = logs.map(log => {
            const exData = log.exercises.find(e => e.name === exerciseName);
            if (!exData) return null;

            let max1RM = 0;
            let maxWeight = 0;

            exData.sets.forEach(s => {
                const w = s.weight || 0;
                const r = s.reps || 0;
                if (w > maxWeight) maxWeight = w;

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

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);

        const logs = await WorkoutLog.find({
            user: userId,
            type: 'gym',
            date: { $gte: sinceDate }
        });

        const allExercises = await Exercise.find({
            $or: [{ user: userId }, { isCustom: false }, { user: null }]
        });

        const exerciseToMuscle = {};
        allExercises.forEach(ex => {
            exerciseToMuscle[ex.name] = ex.muscle;
        });

        const muscleStats = {
            'Pecho': 0, 'Espalda': 0, 'Pierna': 0,
            'Hombro': 0, 'Bíceps': 0, 'Tríceps': 0, 'Abdomen': 0
        };

        logs.forEach(log => {
            log.exercises.forEach(ex => {
                const muscle = exerciseToMuscle[ex.name];
                if (muscle && muscleStats[muscle] !== undefined) {
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