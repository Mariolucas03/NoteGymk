require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect } = require('./db/connection');
const mongoose = require('mongoose');

console.log("Intentando conectar a BBDD...");
console.log("URI definida:", process.env.MONGO_URI ? "SÍ" : "NO (Undefined)");

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rpg_life';
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors({ origin: 'http://localhost:3005' }));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use('/api/auth', authRoutes);
app.use('/api', require('./routes/missionRoutes'));


// Start
(async () => {
    try {
        await connect(MONGO_URI);
        app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
    } catch (err) {
        console.error('Failed to start server', err);
    }
})();
