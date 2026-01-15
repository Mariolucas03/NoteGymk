require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initScheduledJobs } = require('./utils/scheduler');
const { errorHandler } = require('./middleware/errorMiddleware');
const mongoSanitize = require('express-mongo-sanitize');

// --- 1. IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dailyRoutes = require('./routes/daily');
const gymRoutes = require('./routes/gym');
const foodRoutes = require('./routes/food');
const socialRoutes = require('./routes/social');
const missionRoutes = require('./routes/missions');
const shopRoutes = require('./routes/shop');
const clanRoutes = require('./routes/clans');
const challengeRoutes = require('./routes/challenges');
const pushRoutes = require('./routes/push');
const eventRoutes = require('./routes/eventRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Seguridad: Prevenir inyección NoSQL
app.use(mongoSanitize());

// --- 2. DEFINICIÓN DE ENDPOINTS (CONECTANDO LOS CABLES) ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);        // Corrige el 404 de /api/users/claim-daily
app.use('/api/daily', dailyRoutes);       // Corrige el 404 de /api/daily
app.use('/api/gym', gymRoutes);           // Corrige el 404 de /api/gym/routines
app.use('/api/food', foodRoutes);         // Corrige el 404 de /api/food/log
app.use('/api/social', socialRoutes);     // Corrige el 404 de /api/social/friends
app.use('/api/missions', missionRoutes);  // Corrige el 404 de /api/missions
app.use('/api/shop', shopRoutes);
app.use('/api/clans', clanRoutes);        // Corrige el 404 de /api/clans/me
app.use('/api/challenges', challengeRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/events', eventRoutes);

// Inicializar Cron Jobs (Mantenimiento nocturno y recordatorios)
initScheduledJobs();

app.get('/', (req, res) => res.send('API NoteGymk funcionando 🚀'));

// Middleware de manejo de errores (SIEMPRE AL FINAL)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Escuchar en 0.0.0.0 para acceso desde móvil en red local
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Servidor iniciado en puerto ${PORT}`));

// index.js o server.js
app.get('/ping', (req, res) => {
    res.send('pong 🏓');
});