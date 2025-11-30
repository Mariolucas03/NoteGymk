const express = require('express');
const cors = require('cors');
const { connect } = require('./db/connection');
const mongoose = require('mongoose');
const routes = require('./routes/userRoutes');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rpg_life';
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Minimal User model (if you want separate file, move this)
const UserSchema = new mongoose.Schema({
    _id: String,
    name: String,
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    lives: { type: Number, default: 3 },
    events: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
// expose for controller require pattern above
module.exports.User = User;

app.use('/api', routes);

// Start
(async () => {
    try {
        await connect(MONGO_URI);
        app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
    } catch (err) {
        console.error('Failed to start server', err);
    }
})();
