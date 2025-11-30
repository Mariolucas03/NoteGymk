const User = require('../models/User'); // We'll define inline model in server.js for simplicity

// Note: In this repo the model is defined in server.js to reduce file count.
// If you prefer, move the model to models/User.js and require here.

async function getUser(req, res) {
    try {
        const id = req.params.id;
        let user = await User.findById(id).lean();
        if (!user) {
            user = await User.create({ _id: id, name: 'Usuario', xp: 0, coins: 200, lives: 3, events: [] });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

async function addXp(req, res) {
    try {
        const { id } = req.params;
        // safe destructuring
        let amount = 0, meta = {}, timestamp;
        if (req.body && typeof req.body === 'object') {
            ({ amount = 0, meta = {}, timestamp } = req.body);
        } else {
            return res.status(400).json({ error: 'invalid_body', message: 'body must be JSON' });
        }
        amount = Number(amount) || 0;
        const time = timestamp ? new Date(timestamp) : new Date();

        const user = await User.findByIdAndUpdate(id, {
            $inc: { xp: amount },
            $push: { events: { type: 'xp', amount, meta, date: time.toISOString().split('T')[0], timestamp: time } }
        }, { new: true, upsert: true });

        res.json({ ok: true, xp: user.xp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

async function addGym(req, res) {
    try {
        const { id } = req.params;
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'invalid_body' });
        }
        const { date, group, exercises = [], duration = 0 } = req.body;
        const day = date || new Date().toISOString().split('T')[0];

        const user = await User.findByIdAndUpdate(id, {
            $push: { events: { type: 'gym', group, exercises, duration, date: day, timestamp: new Date() } }
        }, { new: true, upsert: true });

        res.json({ ok: true, events: user.events });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

async function addEvent(req, res) {
    try {
        const { id } = req.params;
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'invalid_body' });
        }
        const payload = req.body;
        // ensure date
        const date = payload.date || new Date().toISOString().split('T')[0];

        const user = await User.findByIdAndUpdate(id, {
            $push: { events: { ...payload, date } }
        }, { new: true, upsert: true });

        res.json({ ok: true, events: user.events });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

async function getEvents(req, res) {
    try {
        const { id } = req.params;
        const user = await User.findById(id).lean();
        if (!user) return res.json([]);
        res.json(user.events || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

module.exports = { getUser, addXp, addGym, addEvent, getEvents };
