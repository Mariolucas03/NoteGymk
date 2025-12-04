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
