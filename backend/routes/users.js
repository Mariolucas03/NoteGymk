const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    claimDailyReward,
    addGameReward,
    updateMacros // <--- Importamos
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// --- RUTAS PÚBLICAS ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- RUTAS PRIVADAS ---
router.get('/me', protect, getMe);
router.post('/claim-daily', protect, claimDailyReward);
router.post('/reward', protect, addGameReward);

// ✅ NUEVA RUTA: Actualizar objetivos nutricionales
router.put('/macros', protect, updateMacros);

module.exports = router;