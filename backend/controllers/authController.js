const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para generar Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secreto_super_seguro', {
        expiresIn: '30d',
    });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Rellena todos los campos' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creamos el usuario (automáticamente recibe createdAt y valores por defecto)
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        if (user) {
            // AQUÍ ESTABA EL ERROR: Devolvemos TODOS los datos necesarios
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                // Datos RPG (Planos, sin 'stats')
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                coins: user.coins,
                lives: user.lives,
                dailyRewards: user.dailyRewards,
                createdAt: user.createdAt, // <--- ¡ESTO FALTABA!

                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Datos inválidos' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en servidor' });
    }
};

// @desc    Login usuario
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {

            // AQUÍ TAMBIÉN: Devolvemos la estructura completa
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                coins: user.coins,
                lives: user.lives,
                dailyRewards: user.dailyRewards,
                createdAt: user.createdAt, // <--- CRUCIAL para el cálculo de días

                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en servidor' });
    }
};

module.exports = { registerUser, loginUser };