const express = require('express');
const router = express.Router();
const { getDailyLog, updateDailyItem, getHistory } = require('../controllers/dailyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDailyLog);
router.get('/history', protect, getHistory);
router.put('/update', protect, updateDailyItem);

module.exports = router;