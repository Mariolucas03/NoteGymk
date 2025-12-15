require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const initScheduledJobs = require('./utils/scheduler');

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Iniciar el cron de medianoche
initScheduledJobs();

// --- GESTIÓN DE RUTAS ---

// 1. AUTENTICACIÓN Y USUARIOS
// Mapeamos /api/auth al archivo de rutas.
// Como en el archivo pusimos '/register', la ruta final es: /api/auth/register
app.use('/api/auth', require('./routes/users'));

// Dejamos este también por si usas /api/users/me en el perfil
app.use('/api/users', require('./routes/users'));

// 2. RESTO DE RUTAS
app.use('/api/daily', require('./routes/daily'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/gym', require('./routes/gym'));
app.use('/api/food', require('./routes/food'));
app.use('/api/shop', require('./routes/shop'));

// Ruta base
app.get('/', (req, res) => res.send('API NoteGymk funcionando 🚀'));

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT} 🔥`));