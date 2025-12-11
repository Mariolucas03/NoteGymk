const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }, // <--- NUEVO
    servingSize: { type: String, default: '100g' },
    icon: { type: String, default: '🍎' }
});

// Índice para búsquedas
foodSchema.index({ name: 'text' });

module.exports = mongoose.model('Food', foodSchema);