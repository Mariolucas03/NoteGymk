const Food = require('../models/Food');
const NutritionLog = require('../models/NutritionLog');
const DailyLog = require('../models/DailyLog');
const OpenAI = require("openai");
const fs = require('fs');

// Configuración OpenRouter (Modelos Gratuitos)
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NoteGym App",
    }
});

const getTodayStr = () => new Date().toISOString().split('T')[0];

// --- GESTIÓN DE LOGS DIARIOS ---
const getNutritionLog = async (req, res) => {
    try {
        const today = getTodayStr();
        let log = await NutritionLog.findOne({ user: req.user._id, date: today });
        if (!log) {
            log = await NutritionLog.create({
                user: req.user._id,
                date: today,
                meals: [
                    { name: 'DESAYUNO', foods: [] },
                    { name: 'SNACK', foods: [] },
                    { name: 'COMIDA', foods: [] },
                    { name: 'MERIENDA', foods: [] },
                    { name: 'CENA', foods: [] }
                ]
            });
        }
        res.json(log);
    } catch (error) { res.status(500).json({ message: 'Error cargando nutrición' }); }
};

const addMealCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const today = getTodayStr();
        let log = await NutritionLog.findOne({ user: req.user._id, date: today });
        if (!log) return res.status(404).json({ message: 'Log no iniciado' });
        log.meals.push({ name: name.toUpperCase(), foods: [] });
        await log.save();
        res.json(log);
    } catch (error) { res.status(500).json({ message: 'Error creando categoría' }); }
};

const addFoodEntry = async (req, res) => {
    try {
        const { mealId, foodId, rawFood, quantity } = req.body;
        const today = getTodayStr();
        let entryData = {};

        if (foodId) {
            const foodItem = await Food.findById(foodId);
            if (!foodItem) return res.status(404).json({ message: 'Alimento no encontrado' });

            entryData = {
                food: foodItem._id,
                name: foodItem.name,
                calories: foodItem.calories,
                protein: foodItem.protein,
                carbs: foodItem.carbs,
                fat: foodItem.fat,
                fiber: foodItem.fiber || 0
            };
        } else if (rawFood) {
            entryData = {
                name: rawFood.name,
                calories: rawFood.calories,
                protein: rawFood.protein,
                carbs: rawFood.carbs,
                fat: rawFood.fat,
                fiber: rawFood.fiber || 0
            };
        } else { return res.status(400).json({ message: 'Faltan datos' }); }

        const finalEntry = {
            ...entryData,
            calories: Math.round(entryData.calories * quantity),
            protein: Math.round(entryData.protein * quantity),
            carbs: Math.round(entryData.carbs * quantity),
            fat: Math.round(entryData.fat * quantity),
            fiber: Math.round(entryData.fiber * quantity),
            quantity
        };

        let log = await NutritionLog.findOne({ user: req.user._id, date: today });
        const mealBox = log.meals.id(mealId);
        if (!mealBox) return res.status(404).json({ message: 'Caja no encontrada' });

        mealBox.foods.push(finalEntry);

        log.totalCalories += finalEntry.calories;
        log.totalProtein += finalEntry.protein;
        log.totalCarbs += finalEntry.carbs;
        log.totalFat += finalEntry.fat;
        log.totalFiber += finalEntry.fiber;

        await log.save();
        await DailyLog.findOneAndUpdate({ user: req.user._id, date: today }, { totalKcal: log.totalCalories }, { upsert: true });
        res.json(log);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Error añadiendo comida' }); }
};

// --- GESTIÓN DE COMIDAS GUARDADAS ---
const getSavedFoods = async (req, res) => {
    try {
        const foods = await Food.find().sort({ _id: -1 }).limit(50);
        res.json(foods);
    } catch (error) { res.status(500).json({ message: 'Error cargando lista' }); }
};

const saveCustomFood = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, fiber, servingSize } = req.body;
        const newFood = await Food.create({
            name, calories, protein, carbs, fat,
            fiber: fiber || 0,
            servingSize: servingSize || '1 ración',
            icon: '🍽️'
        });
        res.status(201).json(newFood);
    } catch (error) { res.status(500).json({ message: 'Error guardando comida' }); }
};

// NUEVO: Borrar comida guardada
const deleteSavedFood = async (req, res) => {
    try {
        await Food.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alimento eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando alimento' });
    }
};

const seedFoods = async (req, res) => { res.json({ message: 'Seed desactivado' }); };

// --- IA ROBUSTA (Con Contexto) ---
const analyzeImage = async (req, res) => {
    const FREE_MODELS = [
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "google/gemini-flash-1.5-exp:free",
        "qwen/qwen-2-vl-7b-instruct:free"
    ];

    try {
        if (!req.file) return res.status(400).json({ message: 'No hay imagen' });

        const userContext = req.body.context || "Sin contexto extra.";
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        let foodData = null;

        const finalPrompt = `
      Analiza la imagen. Actúa como nutricionista.
      CONTEXTO DEL USUARIO: "${userContext}".
      Identifica el alimento. Devuelve SOLO un JSON válido: 
      { "name": "Nombre corto", "calories": numero, "protein": numero, "carbs": numero, "fat": numero, "fiber": numero, "servingSize": "ej: 100g" }. 
      Si no es comida: { "error": "No es comida" }.
    `;

        for (const modelName of FREE_MODELS) {
            try {
                console.log(`📡 Probando ${modelName}...`);
                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: finalPrompt },
                            { type: "image_url", image_url: { url: base64Image } }
                        ]
                    }]
                });

                const text = completion.choices[0].message.content;
                console.log("🤖 Respuesta:", text);

                const startIndex = text.indexOf('{');
                const endIndex = text.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                    const jsonStr = text.substring(startIndex, endIndex + 1);
                    foodData = JSON.parse(jsonStr);
                    break;
                }
            } catch (error) {
                console.log(`❌ Falló ${modelName}, siguiente...`);
            }
        }

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (foodData) {
            if (foodData.error) return res.status(400).json({ message: foodData.error });
            return res.json(foodData);
        } else {
            return res.status(500).json({ message: 'Todos los modelos IA están ocupados. Intenta en 1 min.' });
        }

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error interno' });
    }
};

module.exports = {
    getNutritionLog, addFoodEntry, addMealCategory, seedFoods,
    analyzeImage, getSavedFoods, saveCustomFood, deleteSavedFood
};