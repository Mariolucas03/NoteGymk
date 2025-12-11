const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Definimos las rutas
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;