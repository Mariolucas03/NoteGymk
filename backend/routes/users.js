const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

// Importamos TODAS las funciones del controlador (incluidas las de Game Over y Debug)
const {
    getMe,
    updateMacros,
    claimDailyReward,
    addGameReward,
    updatePhysicalStats,
    simulateYesterday,
    setManualStreak,
    forceNightlyMaintenance,
    setRedemptionMission,
    reviveUser,
    updateStatsManual
} = require('../controllers/userController');

// ==========================================
// 🟢 RUTAS DE PERFIL Y DATOS
// ==========================================

// 1. Obtener perfil del usuario
router.get('/', protect, getMe);

// 2. Actualizar Macros
router.put('/macros', protect, updateMacros);

// 3. Recompensas (Diaria y Genérica)
router.post('/claim-daily', protect, claimDailyReward);
router.post('/reward', protect, addGameReward);

// 4. Actualizar datos físicos (Edad, Altura, Género)
router.put('/physical-stats', protect, updatePhysicalStats);


// ==========================================
// 🟡 ZONA DE DEBUG (PRUEBAS)
// ==========================================

// Simular que la última visita fue ayer (para probar rachas)
router.post('/debug/yesterday', protect, simulateYesterday);

// Forzar una racha específica
router.put('/debug/streak', protect, setManualStreak);

// Forzar el mantenimiento nocturno (para probar castigos de vida)
router.post('/debug/force-night', protect, forceNightlyMaintenance);


// ==========================================
// 🔴 LÓGICA DE JUEGO (GAME OVER / REDENCIÓN)
// ==========================================

// Establecer la misión para salir del Game Over
router.post('/set-redemption-mission', protect, setRedemptionMission);

// Revivir (Resetear vida a 20)
router.post('/revive', protect, reviveUser);

// Actualizar stats manualmente (Vida, XP, Monedas) - Útil para testing
router.put('/update-stats', protect, updateStatsManual);

module.exports = router;