const express = require('express');
const router = express.Router();

// Importamos el controlador
const {
    getDailyLog,
    updateDailyLog,
    getDailyLogByDate,
    getWeightHistory
} = require('../controllers/dailyController');

// Importamos el middleware de autenticación (sin llaves, según tu corrección)
const protect = require('../middleware/authMiddleware');

// 🔥 IMPORTANTE: Importamos el middleware de Racha
const { checkStreak } = require('../middleware/streakMiddleware');

// ==========================================
// RUTAS
// ==========================================

// 1. Obtener datos de HOY (Home)
// Se ejecuta 'checkStreak' antes de devolver los datos para asegurar que la racha esté al día
router.get('/', protect, checkStreak, getDailyLog);

// 2. Actualizar datos de HOY (Widgets: Peso, Sueño, Mood, etc.)
router.put('/', protect, updateDailyLog);

// 3. Obtener datos de una FECHA ANTIGUA (Para el Calendario en Perfil)
router.get('/specific', protect, getDailyLogByDate);

// 4. Obtener historial de PESO (Para la gráfica del Widget)
router.get('/history', protect, getWeightHistory);

module.exports = router;