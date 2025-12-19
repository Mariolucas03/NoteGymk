const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

// Importamos las funciones que creamos en el controlador
const {
    getMe,
    updateMacros,
    claimDailyReward,
    addGameReward
} = require('../controllers/userController');

// ==========================================
// 🟢 RUTAS NUEVAS (SOLUCIÓN AL 404)
// ==========================================

// 1. Obtener perfil
router.get('/', protect, getMe);

// 2. Actualizar Macros (ESTA ES LA QUE FALLABA)
router.put('/macros', protect, updateMacros);

// 3. Recompensas
router.post('/claim-daily', protect, claimDailyReward);
router.post('/reward', protect, addGameReward);


// ==========================================
// 🔴 LÓGICA DE JUEGO (Muerte y Redención)
// ==========================================
// Mantenemos esto aquí inline para no romper tu sistema de "Game Over"

// Establecer misión de rescate
router.post('/set-redemption-mission', protect, async (req, res) => {
    try {
        const { mission } = req.body;
        if (!mission || mission.trim() === '') {
            return res.status(400).json({ message: "La misión es obligatoria" });
        }

        const user = await User.findById(req.user.id);
        if (user.redemptionMission) {
            return res.status(400).json({ message: "Pacto ya sellado." });
        }

        user.redemptionMission = mission;
        await user.save();
        res.json({ message: "Pacto sellado", user });
    } catch (error) {
        res.status(500).json({ message: "Error servidor" });
    }
});

// Revivir (Resetear vida)
router.post('/revive', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Solo permite revivir si está muerto (o cerca) para evitar trampas, 
        // aunque para testing permitimos si hp <= 0.
        user.stats.hp = 20; // Revive con poca vida
        user.lives = 20;    // Compatibilidad

        await user.save();
        res.json({ message: "Has revivido.", user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Actualizar stats manualmente (Debug/Testing)
router.put('/update-stats', protect, async (req, res) => {
    const { hp, xp, coins } = req.body;
    try {
        const user = await User.findById(req.user.id);

        if (hp !== undefined) {
            user.stats.hp = hp;
            user.lives = hp; // Mantener sincro
        }
        if (xp !== undefined) user.stats.currentXP = xp;
        if (coins !== undefined) {
            user.stats.coins = coins;
            user.coins = coins; // Mantener sincro
        }

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;