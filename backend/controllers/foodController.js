const Food = require('../models/Food');
const NutritionLog = require('../models/NutritionLog');
const DailyLog = require('../models/DailyLog');
const OpenAI = require("openai");
const fs = require('fs');

// Configuración OpenRouter
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NoteGym App",
    }
});

const getTodayStr = () => new Date().toISOString().split('T')[0];

// --- 1. GESTIÓN DE LOGS DIARIOS ---

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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando nutrición' });
    }
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
        if (!log) {
            log = await NutritionLog.create({ user: req.user._id, date: today, meals: [] });
        }

        const mealBox = log.meals.id(mealId);
        if (!mealBox) return res.status(404).json({ message: 'Caja no encontrada' });

        mealBox.foods.push(finalEntry);

        // Recalcular totales generales
        log.totalCalories += finalEntry.calories;
        log.totalProtein += finalEntry.protein;
        log.totalCarbs += finalEntry.carbs;
        log.totalFat += finalEntry.fat;
        log.totalFiber += finalEntry.fiber;

        await log.save();

        // -----------------------------------------------------------
        // ✅ CORRECCIÓN CRÍTICA: CALCULAR DESGLOSE POR COMIDA
        // -----------------------------------------------------------
        const getMealTotal = (name) => {
            const meal = log.meals.find(m => m.name === name);
            return meal ? meal.foods.reduce((acc, f) => acc + f.calories, 0) : 0;
        };

        const nutritionBreakdown = {
            totalKcal: log.totalCalories,
            breakfast: getMealTotal('DESAYUNO'),
            lunch: getMealTotal('COMIDA'),
            dinner: getMealTotal('CENA'),
            snacks: getMealTotal('SNACK'),
            merienda: getMealTotal('MERIENDA') // <--- Añadimos merienda
        };

        // Actualizar DailyLog global con el desglose completo
        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            {
                totalKcal: log.totalCalories,
                nutrition: nutritionBreakdown
            },
            { upsert: true }
        );
        // -----------------------------------------------------------

        res.json(log);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Error añadiendo comida' }); }
};

// ... (El resto del archivo sigue IGUAL, solo copia hasta aquí o mantén lo de abajo si no quieres copiar todo)
// Para facilitar, aquí tienes el resto de funciones sin cambios:

const getSavedFoods = async (req, res) => {
    try {
        const foods = await Food.find({ user: req.user._id }).sort({ _id: -1 }).limit(50);
        res.json(foods);
    } catch (error) { res.status(500).json({ message: 'Error cargando lista' }); }
};

const saveCustomFood = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, fiber, servingSize } = req.body;
        const newFood = await Food.create({
            user: req.user._id,
            name, calories, protein, carbs, fat,
            fiber: fiber || 0,
            servingSize: servingSize || '1 ración',
            icon: '🍽️'
        });
        res.status(201).json(newFood);
    } catch (error) { res.status(500).json({ message: 'Error guardando comida' }); }
};

const deleteSavedFood = async (req, res) => {
    try {
        const result = await Food.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!result) return res.status(404).json({ message: 'No encontrado o no tienes permiso' });
        res.json({ message: 'Alimento eliminado' });
    } catch (error) { res.status(500).json({ message: 'Error eliminando alimento' }); }
};

const updateSavedFood = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, fiber } = req.body;
        const updatedFood = await Food.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { name, calories, protein, carbs, fat, fiber },
            { new: true }
        );
        if (!updatedFood) return res.status(404).json({ message: 'Comida no encontrada o no tienes permiso' });
        res.json(updatedFood);
    } catch (error) { res.status(500).json({ message: 'Error actualizando comida' }); }
};

const seedFoods = async (req, res) => { res.json({ message: 'Seed desactivado' }); };

const analyzeImage = async (req, res) => {
    const VISION_MODELS = [
        "google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.2-11b-vision-instruct:free", "google/gemini-flash-1.5-exp:free",
        "qwen/qwen-2-vl-7b-instruct:free", "google/gemini-pro-1.5-exp:free", "meta-llama/llama-3.2-90b-vision-instruct:free",
        "qwen/qwen-2-vl-72b-instruct:free", "google/gemini-flash-1.5-8b-exp:free"
    ];
    try {
        if (!req.file) return res.status(400).json({ message: 'No hay imagen' });
        const userContext = req.body.context || "Sin contexto extra.";
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        let foodData = null;
        const finalPrompt = `Analiza la imagen. Actúa como nutricionista. CONTEXTO DEL USUARIO: "${userContext}". Identifica el alimento. Devuelve SOLO un JSON válido: { "name": "Nombre corto", "calories": numero, "protein": numero, "carbs": numero, "fat": numero, "fiber": numero, "servingSize": "ej: 100g" }. Si no es comida: { "error": "No es comida" }.`;

        for (const modelName of VISION_MODELS) {
            try {
                console.log(`📷 Probando FOTO con ${modelName}...`);
                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [{ role: "user", content: [{ type: "text", text: finalPrompt }, { type: "image_url", image_url: { url: base64Image } }] }]
                });
                const text = completion.choices[0].message.content;
                const startIndex = text.indexOf('{');
                const endIndex = text.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                    const jsonStr = text.substring(startIndex, endIndex + 1);
                    foodData = JSON.parse(jsonStr);
                    console.log(`✅ ÉXITO FOTO con ${modelName}`);
                    break;
                }
            } catch (error) { console.log(`❌ Falló FOTO ${modelName}: ${error.message}`); }
        }
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (foodData) {
            if (foodData.error) return res.status(400).json({ message: foodData.error });
            return res.json(foodData);
        } else { return res.status(503).json({ message: 'Todos los modelos de visión están ocupados. Intenta en 1 min.' }); }
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error interno de imagen' });
    }
};

const chatMacroCalculator = async (req, res) => {
    if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ message: 'Falta configuración de API' });
    const CHAT_MODELS = ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.2-3b-instruct:free", "google/gemini-flash-1.5-exp:free", "meta-llama/llama-3.2-11b-vision-instruct:free", "huggingfaceh4/zephyr-7b-beta:free", "google/gemini-2.0-flash-thinking-exp:free", "liquid/lfm-40b:free", "mistralai/mistral-7b-instruct:free", "microsoft/phi-3-medium-128k-instruct:free", "openchat/openchat-7b:free"];
    try {
        const { history } = req.body;
        const systemPrompt = `Eres un nutricionista experto de NoteGymk. Objetivo: calcular TDEE y macros. Necesitas: Edad, Género, Peso, Altura, Actividad, Objetivo. 1. Pide datos que falten (sé breve). 2. SI TIENES TODO: Calcula y responde SOLO con este JSON: { "done": true, "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "message": "Plan listo." } 3. SI NO: Responde texto normal (pregunta).`;
        const messages = [{ role: "system", content: systemPrompt }, ...history];
        let content = null;
        let success = false;
        for (const modelName of CHAT_MODELS) {
            try {
                console.log(`💬 Intentando CHAT con: ${modelName}...`);
                const completion = await openai.chat.completions.create({ model: modelName, messages: messages, temperature: 0.7 });
                content = completion.choices[0].message.content;
                if (content && content.length > 0) { success = true; console.log(`✅ ÉXITO CHAT con ${modelName}`); break; }
            } catch (error) { console.log(`⚠️ Falló CHAT ${modelName}: ${error.status || error.message}`); }
        }
        if (!success) return res.status(503).json({ message: 'Servidores saturados. Revisa tu API Key.' });
        try {
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = content.substring(jsonStart, jsonEnd + 1);
                const data = JSON.parse(jsonStr);
                if (data.done) return res.json({ type: 'final', data: data });
            }
        } catch (e) { }
        res.json({ type: 'question', message: content });
    } catch (error) { console.error("Error Crítico Chat:", error); res.status(500).json({ message: 'Error interno del asistente' }); }
};

module.exports = {
    getNutritionLog, addFoodEntry, addMealCategory, seedFoods,
    analyzeImage, getSavedFoods, saveCustomFood, deleteSavedFood,
    chatMacroCalculator, updateSavedFood
};