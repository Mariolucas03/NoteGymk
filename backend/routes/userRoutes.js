const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');

// Rutas para leer/modificar un usuario existente
router.get('/user/:id', ctrl.getUser);
router.post('/user/:id/xp', ctrl.addXp);
router.post('/user/:id/gym', ctrl.addGym);
router.post('/user/:id/events', ctrl.addEvent);
router.get('/user/:id/events', ctrl.getEvents);
router.post('/user/:id/objectives', ctrl.updateObjectives);

// --- RUTA NUEVA: CREAR USUARIO ---
// Esta es la que conecta con el botón rojo del Frontend
router.post('/user', ctrl.createUser);
// ---------------------------------

module.exports = router;
