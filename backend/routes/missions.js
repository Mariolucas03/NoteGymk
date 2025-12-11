const express = require('express');
const router = express.Router();
const { getMissions, createMission, completeMission, deleteMission } = require('../controllers/missionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMissions);
router.post('/', protect, createMission);
router.put('/:id/complete', protect, completeMission);
router.delete('/:id', protect, deleteMission);

module.exports = router;