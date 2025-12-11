require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./db/connection'); // Mantiene viva la conexión a Mongo

const app = express();

app.use(cors());
app.use(express.json());

// Única ruta de prueba (Esto soluciona el error "Cannot GET /")
app.get('/', (req, res) => {
    res.send('✅ Backend conectado a MongoDB y funcionando en Vercel/Render');
});

// CAMBIO IMPORTANTE: Ponemos 5000 para que coincida con tu Frontend
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor limpio corriendo en puerto ${PORT}`);
});