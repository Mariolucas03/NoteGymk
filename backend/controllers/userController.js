const User = require('../models/User');

// Helper: Calculate reward for a specific day
const getRewardForDay = (day) => {
    // 1. Monthly (Day 30, 60, 90...)
    if (day % 30 === 0) {
        return { coins: 500, xp: 500, type: 'monthly', label: 'Mega Cofre' };
    }
    // 2. Weekly (Day 7, 14, 21...)
    if (day % 7 === 0) {
        return { coins: 150, xp: 100, type: 'weekly', label: 'Gran Cofre' };
    }
    // 3. Normal Day
    return { coins: 50, xp: 20, type: 'daily', label: 'Recompensa Diaria' };
};

// POST /api/user/claim-daily
exports.claimDailyReward = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check if already claimed today
        if (user.lastDailyClaim) {
            const lastClaim = new Date(user.lastDailyClaim);
            const lastClaimDate = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());

            if (lastClaimDate.getTime() === today.getTime()) {
                return res.status(400).json({ message: 'Already claimed today' });
            }
        }

        // Calculate Reward based on current streak
        // If missed a day (logic could be added here to reset streak, but for now we keep it simple/permissive)
        // For strict streak reset, we would check diffDays > 1 here.

        const currentDay = user.dailyStreak || 1;
        const reward = getRewardForDay(currentDay);

        // Apply Reward
        user.coins += reward.coins;
        user.xp += reward.xp;
        user.lastDailyClaim = now;
        user.dailyStreak += 1;

        // Level Up Logic (Reuse or extract to helper if possible, but keeping inline for safety)
        let xpToNextLevel = user.level * 100;
        while (user.xp >= xpToNextLevel) {
            user.xp -= xpToNextLevel;
            user.level += 1;
            xpToNextLevel = user.level * 100;
        }

        await user.save();

        res.json({
            message: 'Reward claimed',
            reward,
            user: { ...user.toObject(), nextLevelXp: user.level * 100 }
        });

    } catch (err) {
        console.error("Error claiming daily reward:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper endpoint to get next 5 days of rewards (for the UI carousel)
// GET /api/user/rewards-preview
exports.getRewardsPreview = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const currentDay = user.dailyStreak || 1;
        const rewards = [];

        // Generate preview for: Day-2, Day-1, Today, Day+1, Day+2
        for (let i = -2; i <= 2; i++) {
            const day = currentDay + i;
            if (day > 0) {
                rewards.push({
                    day,
                    ...getRewardForDay(day),
                    status: i < 0 ? 'claimed' : (i === 0 ? 'current' : 'locked')
                });
            }
        }

        res.json(rewards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
