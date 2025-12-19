const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función segura para generar Token
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('FATAL: JWT_SECRET no definido en variables de entorno');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
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

        // Creamos usuario con valores iniciales explícitos (opcional, el modelo tiene defaults)
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            coins: 0,
            level: 1,
            lives: 100,
            streak: { current: 1, lastLogDate: new Date() }
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
                // Datos RPG iniciales
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                coins: user.coins,
                lives: user.lives,
                streak: user.streak,
                macros: user.macros, // Importante para el widget de comida
                dailyRewards: user.dailyRewards
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
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
                // Devolvemos TODO el perfil para que el frontend se hidrate
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                coins: user.coins,
                lives: user.lives,
                streak: user.streak,
                macros: user.macros,
                dailyRewards: user.dailyRewards,
                createdAt: user.createdAt
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