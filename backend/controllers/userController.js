const User = require('../models/User');

// --- FUNCIÓN AUXILIAR: Calcular el número de semana (Ej: "2025-W48") ---
function getWeekString(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
}

// Obtener usuario (Con lógica de reinicio DIARIO, SEMANAL, MENSUAL y ANUAL)
async function getUser(req, res) {
    try {
        const id = req.params.id;
        // Usamos .lean() para un objeto JS simple, más fácil de manipular
        let user = await User.findById(id).lean();
        
        const now = new Date();
        const currentDaily = now.toISOString().split('T')[0];
        const currentWeekly = getWeekString(now);
        const currentMonthly = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const currentYearly = `${now.getFullYear()}`;

        const fixedMissions = [
            { id: 1, title: 'Meditar', xp: 20, completed: false, type: 'fixed' },
            { id: 2, title: 'Ejercicio', xp: 50, completed: false, type: 'fixed' },
            { id: 3, title: 'Leer', xp: 15, completed: false, type: 'fixed' },
            { id: 4, title: 'Estudiar', xp: 40, completed: false, type: 'fixed' },
            { id: 5, title: 'Hidratación', xp: 10, completed: false, type: 'fixed' }
        ];

        const defaultObjectives = [
            { id: 'w1', title: 'Planificar semana', type: 'weekly', isFixed: true, completed: false },
            { id: 'w2', title: 'Limpieza casa', type: 'weekly', isFixed: true, completed: false },
            { id: 'w3', title: 'Hacer la compra', type: 'weekly', isFixed: true, completed: false },
            { id: 'm1', title: 'Revisar ahorros', type: 'monthly', isFixed: true, completed: false },
            { id: 'm2', title: 'Leer un libro', type: 'monthly', isFixed: true, completed: false },
            { id: 'm3', title: 'Salida cultural', type: 'monthly', isFixed: true, completed: false },
            { id: 'y1', title: 'Chequeo médico', type: 'yearly', isFixed: true, completed: false },
            { id: 'y2', title: 'Viaje vacaciones', type: 'yearly', isFixed: true, completed: false },
            { id: 'y3', title: 'Aprender habilidad', type: 'yearly', isFixed: true, completed: false },
        ];

        // 1. SI EL USUARIO NO EXISTE -> LO CREAMOS
        if (!user) {
            user = await User.create({ 
                _id: id, 
                name: 'Usuario Nuevo', 
                xp: 0, coins: 200, lives: 3, 
                events: [],
                missions: fixedMissions,
                objectives: defaultObjectives,
                lastDailyReset: currentDaily,
                lastWeeklyReset: currentWeekly,
                lastMonthlyReset: currentMonthly,
                lastYearlyReset: currentYearly
            });
        } 
        // 2. SI EXISTE -> COMPROBAMOS TODOS LOS RELOJES
        else {
            let updates = {}; // Objeto que contendrá SOLO lo que se va a guardar en la DB
            let hasChanges = false;
            let userObjectives = user.objectives || [];

            // --- 0. INICIALIZAR FECHAS EN USUARIOS ANTIGUOS ---
            // Si falta alguna fecha, la establecemos al periodo actual y forzamos el guardado.
            if (!user.lastDailyReset) { updates.lastDailyReset = currentDaily; hasChanges = true; }
            if (!user.lastWeeklyReset) { updates.lastWeeklyReset = currentWeekly; hasChanges = true; }
            if (!user.lastMonthlyReset) { updates.lastMonthlyReset = currentMonthly; hasChanges = true; }
            if (!user.lastYearlyReset) { updates.lastYearlyReset = currentYearly; hasChanges = true; }
            
            // Si el usuario era antiguo y no tenía objetivos, se los ponemos por defecto
            if (userObjectives.length === 0) {
                userObjectives = defaultObjectives;
                hasChanges = true;
            }

            // --- A. LÓGICA DE MISIONES DIARIAS ---
            if (user.lastDailyReset !== currentDaily) {
                console.log(`Reinicio DIARIO para ${id}`);
                let surviving = (user.missions || []).filter(m => m.type === 'fixed');
                if (surviving.length === 0) surviving = fixedMissions;
                
                updates.missions = surviving.map(m => ({ ...m, completed: false }));
                updates.lastDailyReset = currentDaily;
                hasChanges = true;
            }

            // --- B. LÓGICA DE OBJETIVOS (SEMANAL, MENSUAL, ANUAL) ---
            
            // B.1 Reinicio Semanal
            // Si el valor guardado es distinto al actual O si acabamos de inicializarlo:
            if (user.lastWeeklyReset !== currentWeekly) {
                console.log(`Reinicio SEMANAL para ${id}`);
                userObjectives = userObjectives.filter(o => o.type !== 'weekly' || o.isFixed);
                userObjectives.forEach(o => { if (o.type === 'weekly') o.completed = false; });
                
                updates.lastWeeklyReset = currentWeekly;
                hasChanges = true;
            }

            // B.2 Reinicio Mensual
            if (user.lastMonthlyReset !== currentMonthly) {
                console.log(`Reinicio MENSUAL para ${id}`);
                userObjectives = userObjectives.filter(o => o.type !== 'monthly' || o.isFixed);
                userObjectives.forEach(o => { if (o.type === 'monthly') o.completed = false; });
                
                updates.lastMonthlyReset = currentMonthly;
                hasChanges = true;
            }

            // B.3 Reinicio Anual
            if (user.lastYearlyReset !== currentYearly) {
                console.log(`Reinicio ANUAL para ${id}`);
                userObjectives = userObjectives.filter(o => o.type !== 'yearly' || o.isFixed);
                userObjectives.forEach(o => { if (o.type === 'yearly') o.completed = false; });
                
                updates.lastYearlyReset = currentYearly;
                hasChanges = true;
            }

            // Si hubo cambios, incluimos la lista de objetivos final
            if (hasChanges) {
                updates.objectives = userObjectives;
                
                // Usamos $set para forzar el guardado de todos los campos
                // Esto es CRÍTICO para asegurar que las fechas se guardan la primera vez.
                user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true });
            }
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

// Función para guardar misiones diarias
async function updateMissions(req, res) {
    try {
        const { id } = req.params;
        const { missions } = req.body; 
        const user = await User.findByIdAndUpdate(id, { missions }, { new: true });
        res.json({ ok: true, missions: user.missions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

// --- Función para guardar OBJETIVOS ---
async function updateObjectives(req, res) {
    try {
        const { id } = req.params;
        const { objectives } = req.body; 
        const user = await User.findByIdAndUpdate(id, { objectives }, { new: true });
        res.json({ ok: true, objectives: user.objectives });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
}

async function createUser(req, res) {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'user_already_exists', message: 'El usuario ya existe' });
        }
        res.status(500).json({ error: 'failed_to_create_user', details: err.message });
    }
}

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

// IMPORTANTE: Exportamos todas las funciones
module.exports = { getUser, createUser, updateMissions, updateObjectives, addXp, addGym, addEvent, getEvents };