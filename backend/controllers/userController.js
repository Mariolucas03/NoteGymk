const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Registrar nuevo usuario
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.status(400); throw new Error('Por favor rellena todos los campos');
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400); throw new Error('El usuario ya existe');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
        username, email, password: hashedPassword,
        coins: 0, level: 1, currentXP: 0, nextLevelXP: 100,
        streak: { current: 1, lastLogDate: new Date() },
        lives: 100
    });
    if (user) {
        res.status(201).json({
            _id: user.id, username: user.username, email: user.email,
            token: generateToken(user._id), coins: user.coins, level: user.level,
            macros: user.macros // Devolvemos macros
        });
    } else {
        res.status(400); throw new Error('Datos de usuario no válidos');
    }
});

// @desc    Login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id, username: user.username, email: user.email,
            token: generateToken(user._id), coins: user.coins, level: user.level,
            currentXP: user.currentXP, nextLevelXP: user.nextLevelXP,
            streak: user.streak, lives: user.lives,
            macros: user.macros // Devolvemos macros
        });
    } else {
        res.status(401); throw new Error('Credenciales incorrectas');
    }
});

// @desc    Obtener mis datos
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

// @desc    Actualizar Macros y Calorías (NUEVO)
// @route   PUT /api/users/macros
const updateMacros = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.macros = {
            calories: req.body.calories || user.macros.calories,
            protein: req.body.protein || user.macros.protein,
            carbs: req.body.carbs || user.macros.carbs,
            fat: req.body.fat || user.macros.fat,
            fiber: req.body.fiber || user.macros.fiber
        };
        const updatedUser = await user.save();

        // Devolvemos el usuario completo actualizado
        res.json(updatedUser);
    } else {
        res.status(404); throw new Error('Usuario no encontrado');
    }
});

// @desc    Reclamar recompensa diaria
const claimDailyReward = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }
    const creationDate = new Date(user.createdAt);
    const now = new Date();
    const currentDay = Math.ceil(Math.abs(now - creationDate) / (1000 * 60 * 60 * 24));

    if (user.dailyRewards && user.dailyRewards.lastClaimDate) {
        const lastClaim = new Date(user.dailyRewards.lastClaimDate);
        if (lastClaim.getDate() === now.getDate() && lastClaim.getMonth() === now.getMonth() && lastClaim.getFullYear() === now.getFullYear()) {
            res.status(400); throw new Error('Ya has reclamado tu recompensa de hoy');
        }
    }
    if (!user.dailyRewards) { user.dailyRewards = { claimedDays: [], lastClaimDate: null }; }

    const rewardCoins = 50; const rewardXP = 20;
    user.coins += rewardCoins; user.currentXP += rewardXP;
    user.dailyRewards.claimedDays.push(currentDay); user.dailyRewards.lastClaimDate = now;

    while (user.currentXP >= user.nextLevelXP) {
        user.currentXP -= user.nextLevelXP; user.level += 1; user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5); user.lives = 100;
    }
    await user.save();
    res.status(200).json({ message: 'Recompensa reclamada', coins: user.coins, currentXP: user.currentXP, level: user.level, nextLevelXP: user.nextLevelXP, dailyRewards: user.dailyRewards });
});

// @desc    Add game reward
const addGameReward = asyncHandler(async (req, res) => {
    try {
        const { coins, xp, lives } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }

        if (coins) user.coins += Number(coins);
        if (xp) user.currentXP += Number(xp);
        if (lives) user.lives += Number(lives);

        let leveledUp = false;
        while (user.currentXP >= user.nextLevelXP) {
            user.currentXP -= user.nextLevelXP; user.level += 1; user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5); leveledUp = true; user.lives = 100;
        }
        await user.save();
        res.json({ user: { _id: user._id, username: user.username, email: user.email, coins: user.coins, level: user.level, currentXP: user.currentXP, nextLevelXP: user.nextLevelXP, lives: user.lives, macros: user.macros }, leveledUp });
    } catch (error) { console.error(error); res.status(500).json({ message: 'Error procesando recompensa' }); }
});

const generateToken = (id) => { return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_temporal', { expiresIn: '30d' }); };

module.exports = { registerUser, loginUser, getMe, claimDailyReward, addGameReward, updateMacros };