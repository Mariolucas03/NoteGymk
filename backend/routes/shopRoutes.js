const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', shopController.getShopItems);
router.post('/', shopController.createShopItem);
router.post('/buy', shopController.buyItem); // Changed from /buy/:id to /buy to accept body
router.post('/use/:itemId', shopController.useItem);

module.exports = router;
