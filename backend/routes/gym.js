const express = require('express');
const router = express.Router();

const {
    getRoutines,
    createRoutine,
    deleteRoutine,
    getAllExercises,
    createCustomExercise,
    saveWorkoutLog,
    saveSportLog, // <--- Importar
    seedExercises
} = require('../controllers/gymController');

const { protect } = require('../middleware/authMiddleware');

// Rutinas
router.get('/routines', protect, getRoutines);
router.post('/routines', protect, createRoutine);
router.delete('/routines/:id', protect, deleteRoutine);

// Ejercicios
router.get('/exercises', protect, getAllExercises);
router.post('/exercises', protect, createCustomExercise);

// Logs / Registros
router.post('/log', protect, saveWorkoutLog); // Pesas
router.post('/sport', protect, saveSportLog); // <--- NUEVA RUTA DEPORTE

// Utilidades
router.get('/seed', seedExercises);

module.exports = router;