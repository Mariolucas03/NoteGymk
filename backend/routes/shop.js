const express = require('express');
const router = express.Router();
const { getShopItems, createCustomReward, buyItem, useItem, seedShop } = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getShopItems);
router.post('/create', protect, createCustomReward);
router.post('/buy', protect, buyItem);
router.post('/use', protect, useItem);
router.post('/seed', protect, seedShop);

module.exports = router;