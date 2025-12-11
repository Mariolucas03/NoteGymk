require('dotenv').config();
console.log("🔍 DEPURACIÓN URI:", process.env.MONGO_URI);
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // <--- AQUI EL CAMBIO: Usamos la nueva config

const app = express();

// 1. Conectar a Base de Datos
connectDB();

// 2. Middlewares
// Configuración CORS para permitir que tu Frontend (puerto 3005) hable con el Backend
app.use(cors({
    origin: 'http://localhost:3005',
    credentials: true
}));
app.use(express.json());

// 3. Rutas
// Ruta de prueba inicial
app.get('/', (req, res) => {
    res.send('✅ Backend RPG conectado y funcionando');
});

// Rutas de la API (Descomentaremos la siguiente línea en el próximo paso)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/daily', require('./routes/daily'));
app.use('/api/gym', require('./routes/gym'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/food', require('./routes/food'));
app.use('/api/shop', require('./routes/shop'));

// 4. Arrancar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor RPG corriendo en puerto ${PORT}`);
});