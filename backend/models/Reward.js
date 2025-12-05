const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    icon: { type: String, default: '🎫' },
    category: { type: String, default: 'ticket' },
    type: { type: String, default: 'custom' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reward', rewardSchema);
