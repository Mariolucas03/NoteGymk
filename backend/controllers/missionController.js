const Mission = require('../models/Mission');
const User = require('../models/User');

// GET /api/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        // For now, get all missions. In future, filter by date for "daily" logic.
        const missions = await Mission.find({ userId: req.user.userId });

        // Streak Logic
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

        let lastVisit = null;
        if (user.lastStreakDate) {
            const date = new Date(user.lastStreakDate);
            lastVisit = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
                user.streak += 1;
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

        // Calculate nextLevelXp
        const nextLevelXp = user.level * 100;

        res.json({
            user: { ...user.toObject(), nextLevelXp },
            missions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
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

        // 2. Auto-Linking: Find other missions with SAME NAME but different frequency
        // Escape special regex characters to ensure exact match
        const escapedName = mission.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        console.log("--- DEBUG AUTO-LINKING ---");
        console.log("Mission Name:", mission.name);
        console.log("Mission ID:", mission._id);
        console.log("User ID:", req.user.userId);

        const query = {
            userId: req.user.userId,
            name: { $regex: new RegExp(`^${escapedName}$`, 'i') }, // Case-insensitive exact match
            _id: { $ne: mission._id }, // Not the current one
            isCompleted: false, // Only active missions
            targetValue: { $gt: 1 } // Only missions with progress bars (Quest Lines)
        };
        console.log("Query:", JSON.stringify(query, null, 2));

        const linkedMissions = await Mission.find(query);
        console.log("Misiones vinculadas encontradas:", linkedMissions.length);

        // Fetch user once to apply all rewards
        const user = await User.findById(req.user.userId);
        let userUpdated = false;

        // Rewards for the primary mission
        user.coins += mission.coinReward;
        user.xp += mission.xpReward;
        userUpdated = true;

        for (const parentMission of linkedMissions) {
            // Ensure currentValue is a number
            parentMission.currentValue = (parentMission.currentValue || 0) + 1;

            // Check if parent mission is now completed
            if (parentMission.currentValue >= parentMission.targetValue) {
                parentMission.isCompleted = true;

                // Give rewards for parent mission too!
                user.coins += parentMission.coinReward;
                user.xp += parentMission.xpReward;
            }
            await parentMission.save();
        }

        // Level Up Logic (Applied once after all XP gains)
        let xpToNextLevel = user.level * 100;
        while (user.xp >= xpToNextLevel) {
            user.xp -= xpToNextLevel;
            user.level += 1;
            xpToNextLevel = user.level * 100;
        }

        if (userUpdated) {
            await user.save();
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
