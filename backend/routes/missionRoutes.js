const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const missionController = require('../controllers/missionController');

router.get('/dashboard', auth, missionController.getDashboard);
router.post('/missions', auth, missionController.createMission);
router.put('/missions/:id/complete', auth, missionController.completeMission);
router.post('/missions/:id/increment', auth, missionController.incrementMission);
router.delete('/missions/:id', auth, missionController.deleteMission);

module.exports = router;
