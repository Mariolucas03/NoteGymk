const express = require('express');
const router = express.Router();
const { claimDailyReward } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // <--- NECESITAMOS ESTO

router.post('/claim-daily', protect, claimDailyReward);

module.exports = router;