const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Protect all routes
router.use(authMiddleware);

router.post('/claim-daily', userController.claimDailyReward);
router.get('/rewards-preview', userController.getRewardsPreview);

module.exports = router;
