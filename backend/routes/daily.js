const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    getDailyLog,
    getDailyLogByDate,
    updateDailyLog,
    getWeightHistory // <--- Importamos la nueva función
} = require('../controllers/dailyController');

// 1. Obtener datos de HOY (Home)
router.get('/', protect, getDailyLog);

// 2. Actualizar datos de HOY (Widgets)
router.put('/', protect, updateDailyLog);

// 3. Obtener datos de una FECHA ANTIGUA (Perfil/Calendario)
router.get('/specific', protect, getDailyLogByDate);

// 4. Obtener historial de PESO (Para el Widget) - ✅ NUEVA RUTA
router.get('/history', protect, getWeightHistory);

module.exports = router;