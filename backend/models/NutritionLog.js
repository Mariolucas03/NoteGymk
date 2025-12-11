const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }, // <--- NUEVO
    quantity: { type: Number, default: 1 }
});

// Esquema de "Caja de Comida"
const mealCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    foods: [foodEntrySchema]
});

const nutritionLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },

    // Totales del día
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalFiber: { type: Number, default: 0 }, // <--- NUEVO

    // Array dinámico de comidas
    meals: [mealCategorySchema]
});

nutritionLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);