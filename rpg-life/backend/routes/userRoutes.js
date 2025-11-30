const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');

router.get('/user/:id', ctrl.getUser);
router.post('/user/:id/xp', ctrl.addXp);
router.post('/user/:id/gym', ctrl.addGym);
router.post('/user/:id/events', ctrl.addEvent);
router.get('/user/:id/events', ctrl.getEvents);

module.exports = router;
