const express = require('express');
const router = express.Router();
// AQUÍ ESTABA EL ERROR: Faltaba añadir saveWorkoutLog a la lista de importaciones
const {
    getRoutines,
    createRoutine,
    deleteRoutine,
    getExercises,
    seedExercises,
    saveWorkoutLog // <--- ¡IMPORTANTE! AÑADIR ESTO
} = require('../controllers/gymController');

const { protect } = require('../middleware/authMiddleware');

// Rutas de Rutinas
router.get('/routines', protect, getRoutines);
router.post('/routines', protect, createRoutine);
router.delete('/routines/:id', protect, deleteRoutine);

// Rutas de Ejercicios
router.get('/exercises', protect, getExercises);
router.post('/exercises/seed', seedExercises);

// Ruta de Guardado de Entrenamiento (Log)
router.post('/log', protect, saveWorkoutLog); // Ahora sí funcionará

module.exports = router;