const User = require('../models/User');

// Obtener usuario (y si no existe, lo crea automáticamente con datos básicos)
async function getUser(req, res) {
    try {
        const id = req.params.id;
        let user = await User.findById(id).lean();
        
        // Auto-creación si entras al perfil y no existe
        if (!user) {
            user = await User.create({ 
                _id: id, 
                name: 'Usuario Nuevo', 
                xp: 0, 
                coins: 200, 
                lives: 3, 
                events: [] 
            });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

// --- FUNCIÓN NUEVA: Crear usuario manualmente (Para el botón rojo) ---
async function createUser(req, res) {
    try {
        // Crea el usuario con los datos que le mandes desde el Frontend
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        // Si el usuario ya existe (error E11000), devolvemos error pero no explotamos
        if (err.code === 11000) {
            return res.status(400).json({ error: 'user_already_exists', message: 'El usuario ya existe' });
        }
        res.status(500).json({ error: 'failed_to_create_user', details: err.message });
    }
}
// ---------------------------------------------------------------------

async function addXp(req, res) {
    try {
        const { id } = req.params;
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

// Asegúrate de incluir createUser en el export
module.exports = { getUser, createUser, addXp, addGym, addEvent, getEvents };