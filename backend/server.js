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
