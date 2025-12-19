require('dotenv').config(); // <--- ESTO DEBE SER LO PRIMERO
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const initScheduledJobs = require('./utils/scheduler');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

initScheduledJobs();

// --- CORRECCIÓN DE RUTAS ---
// Separación clara de responsabilidades
app.use('/api/auth', require('./routes/auth')); // Solo login/register
app.use('/api/users', require('./routes/users')); // Perfil, macros, rewards
app.use('/api/daily', require('./routes/daily'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/gym', require('./routes/gym'));
app.use('/api/food', require('./routes/food'));
app.use('/api/shop', require('./routes/shop'));

app.get('/', (req, res) => res.send('API NoteGymk funcionando'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno', error: err.message });
});

const PORT = process.env.PORT || 5000;
// LOGS LIMPIOS (Sin emojis en producción idealmente, pero aceptable aquí)
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));