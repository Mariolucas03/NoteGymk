const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    claimDailyReward,
    addGameReward // Asegúrate de que esto está importado
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// --- RUTAS PÚBLICAS ---

// Antes era '/', ahora es '/register' para que la URL sea /api/auth/register
router.post('/register', registerUser);

// Antes era '/login', se queda igual -> /api/auth/login
router.post('/login', loginUser);

// --- RUTAS PRIVADAS (Requieren Token) ---

router.get('/me', protect, getMe);
router.post('/claim-daily', protect, claimDailyReward);
router.post('/reward', protect, addGameReward);

module.exports = router;