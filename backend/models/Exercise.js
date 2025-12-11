const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Ej: "Press de Banca"
    muscle: { type: String, required: true }, // Ej: "Pecho"
    equipment: { type: String, default: "Barra" }, // Ej: "Mancuernas", "Máquina"
    // No guardamos imágenes para ahorrar tus 512MB, usaremos iconos en el front
});

module.exports = mongoose.model('Exercise', exerciseSchema);