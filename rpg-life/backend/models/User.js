const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    lives: { type: Number, default: 3 },
    events: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);