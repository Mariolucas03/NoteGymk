const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Registrar nuevo usuario
// @route   POST /api/users
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error('Por favor rellena todos los campos');
    }

    // Comprobar si existe
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('El usuario ya existe');
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        coins: 0,
        level: 1,
        currentXP: 0,
        nextLevelXP: 100, // Valor inicial
        streak: { current: 1, lastLogDate: new Date() },
        lives: 5
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            coins: user.coins,
            level: user.level
        });
    } else {
        res.status(400);
        throw new Error('Datos de usuario no válidos');
    }
});

// @desc    Autenticar usuario (Login)
// @route   POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Buscar por email
    const user = await User.findOne({ email });

    // Comparar contraseña
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            coins: user.coins,
            level: user.level,
            currentXP: user.currentXP,
            nextLevelXP: user.nextLevelXP,
            streak: user.streak,
            lives: user.lives
        });
    } else {
        res.status(401);
        throw new Error('Credenciales incorrectas');
    }
});

// @desc    Obtener mis datos (Perfil)
// @route   GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
    // req.user ya viene del middleware protect
    res.status(200).json(req.user);
});

// @desc    Reclamar recompensa diaria
// @route   POST /api/users/claim-daily
const claimDailyReward = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    const creationDate = new Date(user.createdAt);
    const now = new Date();
    const currentDay = Math.ceil(Math.abs(now - creationDate) / (1000 * 60 * 60 * 24));

    // Verificar si ya reclamó hoy
    if (user.dailyRewards && user.dailyRewards.lastClaimDate) {
        const lastClaim = new Date(user.dailyRewards.lastClaimDate);
        if (
            lastClaim.getDate() === now.getDate() &&
            lastClaim.getMonth() === now.getMonth() &&
            lastClaim.getFullYear() === now.getFullYear()
        ) {
            res.status(400);
            throw new Error('Ya has reclamado tu recompensa de hoy');
        }
    }

    if (!user.dailyRewards) {
        user.dailyRewards = { claimedDays: [], lastClaimDate: null };
    }

    // RECOMPENSA DIARIA
    const rewardCoins = 50;
    const rewardXP = 20;

    user.coins += rewardCoins;
    user.currentXP += rewardXP;

    user.dailyRewards.claimedDays.push(currentDay);
    user.dailyRewards.lastClaimDate = now;

    // LÓGICA DE SUBIDA DE NIVEL (Igual que en addGameReward)
    while (user.currentXP >= user.nextLevelXP) {
        user.currentXP -= user.nextLevelXP;
        user.level += 1;
        user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5);
        user.lives = 5;
    }

    await user.save();

    res.status(200).json({
        message: 'Recompensa reclamada',
        coins: user.coins,
        currentXP: user.currentXP,
        level: user.level,
        nextLevelXP: user.nextLevelXP,
        dailyRewards: user.dailyRewards
    });
});

// @desc    Sumar recompensa de juego (XP/Monedas) y gestionar Nivel
// @route   POST /api/users/reward
const addGameReward = asyncHandler(async (req, res) => {
    try {
        const { coins, xp } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404);
            throw new Error('Usuario no encontrado');
        }

        // 1. Sumar ganancias
        if (coins) user.coins += Number(coins);
        if (xp) user.currentXP += Number(xp);

        // 2. LÓGICA DE SUBIDA DE NIVEL (ESTO ARREGLA TU FOTO)
        // Usamos un bucle por si ganas tanta XP que subes varios niveles de golpe
        let leveledUp = false;

        while (user.currentXP >= user.nextLevelXP) {
            user.currentXP -= user.nextLevelXP; // Restamos la XP usada (270 - 100 = 170)
            user.level += 1;                    // Nivel 2
            user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5); // Siguiente nivel cuesta 150

            // Si te sobran 170 y el siguiente pide 150, el bucle se repite:
            // 170 - 150 = 20 XP sobrante
            // Nivel 3

            leveledUp = true;
            user.lives = 5; // Rellenar vidas al subir nivel
        }

        await user.save();

        // Devolvemos el usuario perfecto para que el frontend actualice la barra
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                coins: user.coins,
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                lives: user.lives
            },
            leveledUp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error procesando recompensa' });
    }
});

// Función auxiliar para generar JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_temporal', {
        expiresIn: '30d',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    claimDailyReward,
    addGameReward // <--- IMPORTANTE: Exportamos la nueva función
};