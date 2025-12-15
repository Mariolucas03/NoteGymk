const express = require('express');
const router = express.Router();
const {
    getDailyLog,
    updateDailyItem,
    getHistory,
    getSpecificDate
} = require('../controllers/dailyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDailyLog);

// --- CAMBIO AQUÍ: Quita el '/update' y deja solo '/' ---
router.put('/', protect, updateDailyItem);
// ------------------------------------------------------

router.get('/history', protect, getHistory);
router.get('/specific', protect, getSpecificDate);

module.exports = router;