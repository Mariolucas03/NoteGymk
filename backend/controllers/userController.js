const User = require('../models/User');

const claimDailyReward = async (req, res) => {
    try {
        // Buscamos al usuario por su ID
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // 1. Calcular días
        const now = new Date();
        const created = new Date(user.createdAt);
        const diffTime = Math.abs(now - created);
        const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 2. Verificar si ya reclamó (Usamos ?. por seguridad)
        if (user.dailyRewards?.claimedDays?.includes(dayNumber)) {
            return res.status(400).json({ message: 'Ya has reclamado hoy' });
        }

        // 3. Aplicar recompensas (Directo a la raíz del usuario)
        const { coins, xp, lives } = req.body;

        user.coins = (user.coins || 0) + (coins || 0);
        user.currentXP = (user.currentXP || 0) + (xp || 0);
        if (lives) user.lives = Math.min((user.lives || 0) + lives, 5);

        // 4. Registrar el día
        if (!user.dailyRewards) user.dailyRewards = { claimedDays: [] };

        user.dailyRewards.claimedDays.push(dayNumber);
        user.dailyRewards.lastClaimDate = now;

        // 5. Subida de Nivel
        if (user.currentXP >= user.nextLevelXP) {
            user.level += 1;
            user.currentXP -= user.nextLevelXP;
            user.nextLevelXP = Math.floor(user.nextLevelXP * 1.5);
        }

        await user.save();

        // 6. DEVOLVEMOS EL USUARIO ENTERO (Más fácil para el frontend)
        res.json({
            message: 'Recompensa reclamada',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                level: user.level,
                currentXP: user.currentXP,
                nextLevelXP: user.nextLevelXP,
                coins: user.coins,
                lives: user.lives,
                streak: user.streak,
                activeWidgets: user.activeWidgets,
                dailyRewards: user.dailyRewards,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Error en backend:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = { claimDailyReward };