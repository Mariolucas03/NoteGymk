const Mission = require('../models/Mission');
const User = require('../models/User');

// GET /api/dashboard
exports.getDashboard = async (req, res) => {
    console.log("🔴🔴🔴 DENTRO DE GET DASHBOARD 🔴🔴🔴");
    console.log("👉 ID Solicitado:", req.user.userId);
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'Unauthorized: No user ID' });
        }

        const user = await User.findById(req.user.userId).select('-password');
        console.log("👉 Usuario Encontrado:", user ? "SÍ (" + user.email + ")" : "NO (NULL)");

        if (!user) {
            console.log("!!! ALERTA: El usuario con este ID no está en la base de datos local.");
            return res.status(404).json({ message: 'Usuario no encontrado en DB local' });
        }
        console.log("💰 Datos:", { coins: user.coins, xp: user.xp, level: user.level });

        // For now, get all missions. In future, filter by date for "daily" logic.
        const missions = await Mission.find({ userId: req.user.userId });

        // Streak Logic
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

        let lastVisit = null;
        // Strict null check for lastStreakDate
        if (user.lastStreakDate) {
            const date = new Date(user.lastStreakDate);
            // Check if valid date object and valid timestamp
            if (date instanceof Date && !isNaN(date.getTime())) {
                lastVisit = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            }
        }

        if (!lastVisit) {
            // First time or no previous record
            user.streak = 1;
            user.lastStreakDate = now;
            await user.save();
        } else {
            const diffTime = Math.abs(today - lastVisit);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Visited yesterday -> Increment
                user.streak = (user.streak || 0) + 1;
                user.lastStreakDate = now;
                await user.save();
            } else if (diffDays > 1) {
                // Missed a day -> Reset
                user.streak = 1;
                user.lastStreakDate = now;
                await user.save();
            }
            // If diffDays === 0 (Today), do nothing
        }

        // Calculate nextLevelXp (Safe Default)
        const level = user.level || 1;
        const nextLevelXp = level * 100;

        return res.json({
            user: { ...user.toObject(), nextLevelXp },
            missions
        });
    } catch (err) {
        console.error("❌ ERROR EN DASHBOARD:", err);
        // Ensure we send JSON, not HTML, even on crash
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Server Error', error: err.message || 'Unknown Error' });
        }
    }
};

// POST /api/missions
exports.createMission = async (req, res) => {
    console.log("--- DEBUG CREATE MISSION ---");
    console.log("Body:", req.body);
    console.log("User en Request:", req.user);
    console.log("Headers:", req.headers.authorization);
    console.log("----------------------------");

    try {
        // Frontend sends: { name, frequency, isRecurring, xp, coins, difficulty, expiresAt, targetValue }
        const { name, frequency, isRecurring, xp, coins, difficulty, expiresAt, targetValue } = req.body;

        const newMission = new Mission({
            userId: req.user.userId,
            name,
            frequency,
            isRecurring,
            difficulty,
            expiresAt,
            xpReward: xp,
            coinReward: coins,
            targetValue: targetValue || 1
        });

        const mission = await newMission.save();
        res.json(mission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// PUT /api/missions/:id/complete
// PUT /api/missions/:id/complete
exports.completeMission = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id);

        if (!mission) {
            return res.status(404).json({ message: 'Mission not found' });
        }

        if (mission.userId.toString() !== req.user.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (mission.isCompleted) {
            return res.status(400).json({ message: 'Mission already completed' });
        }

        // 1. Mark current mission as completed
        mission.isCompleted = true;
        mission.currentValue = mission.targetValue;
        await mission.save();

        // 2. Update User Stats (Initial)
        const user = await User.findById(req.user.userId);
        user.coins += mission.coinReward;
        user.xp += mission.xpReward;

        // 3. Auto-Linking Logic (Optimized & Atomic)
        // Escape regex special characters
        const escapedName = mission.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const linkFilter = {
            userId: req.user.userId,
            name: { $regex: new RegExp(`^${escapedName}$`, 'i') }, // Case-insensitive exact match
            _id: { $ne: mission._id }, // Not the current one
            isCompleted: false, // Only active missions
            targetValue: { $gt: 1 } // Only missions with progress bars
        };

        // A. Atomic Increment for ALL linked missions
        console.log(`--- AUTO-LINKING: Incrementing linked missions for '${mission.name}' ---`);
        await Mission.updateMany(linkFilter, { $inc: { currentValue: 1 } });

        // B. Find newly completed missions (currentValue >= targetValue)
        const newlyCompleted = await Mission.find({
            ...linkFilter,
            $expr: { $gte: ["$currentValue", "$targetValue"] }
        });

        // C. Apply Rewards & Mark Completed (Bulk)
        if (newlyCompleted.length > 0) {
            const completedIds = [];
            for (const m of newlyCompleted) {
                user.coins += m.coinReward;
                user.xp += m.xpReward;
                completedIds.push(m._id);
            }

            // Bulk set isCompleted = true
            await Mission.updateMany(
                { _id: { $in: completedIds } },
                { $set: { isCompleted: true } }
            );
        }

        // Level Up Logic (Applied after all rewards)
        let xpToNextLevel = user.level * 100;
        while (user.xp >= xpToNextLevel) {
            user.xp -= xpToNextLevel;
            user.level += 1;
            xpToNextLevel = user.level * 100;
        }

        await user.save();

        res.json({
            mission,
            user: { ...user.toObject(), nextLevelXp: user.level * 100 }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.incrementMission = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id);

        if (!mission) {
            return res.status(404).json({ message: 'Mission not found' });
        }

        if (mission.userId.toString() !== req.user.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (mission.isCompleted) {
            return res.status(400).json({ message: 'Mission already completed' });
        }

        mission.currentValue += 1;

        let userUpdated = false;
        let user = null;

        if (mission.currentValue >= mission.targetValue) {
            mission.isCompleted = true;

            // Give rewards
            user = await User.findById(req.user.userId);
            user.coins += mission.coinReward;
            user.xp += mission.xpReward;

            // Level Up Logic
            let xpToNextLevel = user.level * 100;
            while (user.xp >= xpToNextLevel) {
                user.xp -= xpToNextLevel;
                user.level += 1;
                xpToNextLevel = user.level * 100;
            }
            await user.save();
            userUpdated = true;
        }

        await mission.save();

        if (!userUpdated) {
            user = await User.findById(req.user.userId); // Get user anyway for response
        }

        res.json({
            mission,
            user: { ...user.toObject(), nextLevelXp: user.level * 100 }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// DELETE /api/missions/:id
exports.deleteMission = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id);

        if (!mission) {
            return res.status(404).json({ message: 'Mission not found' });
        }

        if (mission.userId.toString() !== req.user.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await mission.deleteOne();
        res.json({ message: 'Mission removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
