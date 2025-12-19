const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getNutritionLog,
    addFoodEntry,
    addMealCategory,
    seedFoods,
    analyzeImage,
    getSavedFoods,
    saveCustomFood,
    deleteSavedFood,
    updateSavedFood, // <--- Importar
    chatMacroCalculator
} = require('../controllers/foodController');
const protect = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.get('/log', protect, getNutritionLog);
router.post('/add', protect, addFoodEntry);
router.post('/category', protect, addMealCategory);
router.post('/seed', protect, seedFoods);
router.post('/analyze', protect, upload.single('image'), analyzeImage);

// Mis Comidas
router.get('/saved', protect, getSavedFoods);
router.post('/save', protect, saveCustomFood);
router.delete('/saved/:id', protect, deleteSavedFood);
router.put('/saved/:id', protect, updateSavedFood); // <--- NUEVA RUTA EDITAR

// Chat
router.post('/chat-macros', protect, chatMacroCalculator);

module.exports = router;