const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const missionController = require('../controllers/missionController');

// Rutas de Lectura
router.get('/dashboard', authMiddleware, missionController.getDashboard);

// Rutas de Escritura (Misiones)
router.post('/missions', authMiddleware, missionController.createMission);
router.put('/missions/:id/complete', authMiddleware, missionController.completeMission);
router.post('/missions/:id/increment', authMiddleware, missionController.incrementMission);
router.delete('/missions/:id', authMiddleware, missionController.deleteMission);

module.exports = router;
