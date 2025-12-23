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

        // Creamos usuario con valores en la RAÍZ (Nueva estructura)
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            coins: 0,
            gameCoins: 500, // Bono de bienvenida para juegos
            level: 1,
            hp: 100,       // Salud en raíz
            lives: 100,    // Compatibilidad
            streak: { current: 1, lastLogDate: new Date() }
        });

        if (user) {
            // Convertimos a objeto para que Mongoose active los Virtuals (stats)
            const userResponse = user.toObject();

            res.status(201).json({
                ...userResponse, // Envía todo: _id, username, coins, level, y el virtual 'stats'
                token: generateToken(user._id)
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
            // Convertimos a objeto para asegurar que el Frontend recibe 
            // tanto los datos planos (root) como el virtual 'stats'
            const userResponse = user.toObject();

            res.json({
                ...userResponse,
                token: generateToken(user._id)
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