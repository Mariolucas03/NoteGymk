const Food = require('../models/Food');
const NutritionLog = require('../models/NutritionLog');
const DailyLog = require('../models/DailyLog');
const fs = require('fs');

// --- 1. CONFIGURACIÓN GEMINI (PARA TEXTO/CHAT) ---
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 2. CONFIGURACIÓN OPENROUTER (PARA IMÁGENES/PLAN B) ---
const OpenAI = require("openai");
const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NoteGym App",
    }
});

const getTodayStr = () => new Date().toISOString().split('T')[0];

// ==========================================
// 🧠 PLAN B: CÁLCULO MATEMÁTICO LOCAL
// ==========================================
const calculateLocalMacros = (text) => {
    console.log("⚠️ Usando Plan B (Matemático)...");

    const ageMatch = text.match(/(\d+)\s*(?:años|a|y)/i) || text.match(/edad\s*[:]?\s*(\d+)/i);
    const weightMatch = text.match(/(\d+)\s*(?:kg|kilos)/i) || text.match(/peso\s*[:]?\s*(\d+)/i);
    const heightMatch = text.match(/(\d+)\s*(?:cm|centimetros)/i) || text.match(/altura\s*[:]?\s*(\d+)/i);
    const genderMatch = text.match(/(hombre|mujer|masculino|femenino)/i);
    const goalMatch = text.match(/(perder|bajar|definir|ganar|subir|masa|mantener)/i);

    if (!ageMatch || !weightMatch || !heightMatch) return null;

    const age = parseInt(ageMatch[1]);
    const weight = parseInt(weightMatch[1]);
    const height = parseInt(heightMatch[1]);
    const isMale = genderMatch && (genderMatch[1].toLowerCase().startsWith('h') || genderMatch[1].toLowerCase().startsWith('m'));
    const goal = goalMatch ? goalMatch[1].toLowerCase() : 'mantener';

    let bmr;
    if (isMale) {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    let activity = 1.375;
    if (text.includes('sedentario')) activity = 1.2;
    if (text.includes('ligero')) activity = 1.375;
    if (text.includes('moderado')) activity = 1.55;
    if (text.includes('intenso')) activity = 1.725;

    let tdee = Math.round(bmr * activity);

    if (goal.includes('perder') || goal.includes('bajar')) tdee -= 400;
    else if (goal.includes('ganar') || goal.includes('subir')) tdee += 300;

    const protein = Math.round((tdee * 0.3) / 4);
    const carbs = Math.round((tdee * 0.4) / 4);
    const fat = Math.round((tdee * 0.3) / 9);
    const fiber = Math.round((tdee / 1000) * 14);

    return {
        done: true,
        calories: tdee,
        protein,
        carbs,
        fat,
        fiber,
        message: "✅ Cálculo realizado (Modo Matemático)."
    };
};

// ==========================================
// 🤖 CALCULADORA CON GEMINI API (TEXTO)
// ==========================================
const chatMacroCalculator = async (req, res) => {
    const { history } = req.body;
    const lastUserMessage = history[history.length - 1].content;

    try {
        // Usamos Gemini Flash OFICIAL para texto (rápido y fiable)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Actúa como un nutricionista experto y calculadora lógica.
            Analiza el siguiente texto del usuario: "${lastUserMessage}".

            TU OBJETIVO: Extraer edad, peso, altura, género, actividad y objetivo.
            
            REGLAS:
            1. Si tienes TODOS los datos (Edad, Peso, Altura, Género):
               - Calcula el TDEE (Harris-Benedict).
               - Aplica ajuste: Déficit (-400kcal), Superávit (+300kcal) o Mantenimiento (0).
               - Distribuye macros: 30% Proteína, 40% Carbos, 30% Grasa.
               - Fibra: 14g por cada 1000kcal.
               - Devuelve JSON con "done": true.
            
            2. Si FALTA algún dato:
               - Devuelve JSON con "done": false.
               - En "message" pregunta educadamente SOLO por el dato que falta.

            FORMATO DE RESPUESTA JSON ESPERADO:
            {
                "done": boolean,
                "calories": number (solo si done=true),
                "protein": number (solo si done=true),
                "carbs": number (solo si done=true),
                "fat": number (solo si done=true),
                "fiber": number (solo si done=true),
                "message": string (Respuesta al usuario)
            }
        `;

        console.log("🤖 Consultando a Google Gemini (Texto)...");

        // 🔥 CORRECCIÓN APLICADA: FORZAR JSON 🔥
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const response = await result.response;
        const jsonText = response.text();
        const data = JSON.parse(jsonText);

        if (data.done) {
            console.log("✅ Gemini calculó los macros correctamente.");
            return res.json({ type: 'final', data: data });
        } else {
            console.log("❓ Gemini pide más datos.");
            return res.json({ type: 'question', message: data.message });
        }

    } catch (error) {
        console.error("❌ Error con Gemini API (Texto):", error.message);

        // --- FALLBACK A PLAN B (Cálculo local) ---
        const localResult = calculateLocalMacros(lastUserMessage);

        if (localResult) {
            return res.json({ type: 'final', data: localResult });
        } else {
            return res.json({
                type: 'question',
                message: "Hubo un error de conexión y no entendí tus datos para el cálculo manual. Por favor, escribe: EDAD, PESO, ALTURA y GÉNERO todo junto."
            });
        }
    }
};

// ==========================================
// 📷 ANÁLISIS DE IMAGEN (VERSION OPENROUTER CASCADA)
// ==========================================
const analyzeImage = async (req, res) => {
    const VISION_MODELS = [
        "google/gemini-flash-1.5-8b-exp:free",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "google/gemini-flash-1.5-exp:free",
        "qwen/qwen-2-vl-7b-instruct:free",
        "google/gemini-pro-1.5-exp:free",
        "meta-llama/llama-3.2-90b-vision-instruct:free",
        "qwen/qwen-2-vl-72b-instruct:free",
        "openrouter/quasar-alpha:free",
        "nousresearch/nous-hermes-2-vision-7b:free"
    ];

    try {
        if (!req.file) return res.status(400).json({ message: 'No hay imagen' });

        const userContext = req.body.context || "Sin contexto extra.";
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        let foodData = null;

        const finalPrompt = `
            Analiza esta imagen de comida. Actúa como nutricionista profesional.
            CONTEXTO ADICIONAL DEL USUARIO: "${userContext}".
            Identifica el alimento principal. Calcula sus macros aproximados.
            RESPONDER SOLO CON UN OBJETO JSON VÁLIDO. SIN TEXTO ANTES NI DESPUÉS.
            Formato JSON: { "name": "Nombre corto del plato", "calories": numero_entero, "protein": numero_entero, "carbs": numero_entero, "fat": numero_entero, "fiber": numero_entero, "servingSize": "ej: 1 ración media (200g)" }
            Si la imagen NO es comida, responde SOLO: { "error": "No detecto comida válida" }
        `;

        for (const modelName of VISION_MODELS) {
            try {
                console.log(`📷 Probando FOTO con ${modelName}...`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

                const completion = await openrouter.chat.completions.create({
                    model: modelName,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: finalPrompt },
                                { type: "image_url", image_url: { url: base64Image, detail: "low" } }
                            ]
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 300,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const text = completion.choices[0].message.content;

                const startIndex = text.indexOf('{');
                const endIndex = text.lastIndexOf('}');

                if (startIndex !== -1 && endIndex !== -1) {
                    let jsonStr = text.substring(startIndex, endIndex + 1);
                    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');

                    foodData = JSON.parse(jsonStr);

                    if (foodData.error || (foodData.name && typeof foodData.calories === 'number')) {
                        console.log(`✅ ÉXITO FOTO con ${modelName}`);
                        break;
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log(`⏳ Timeout con ${modelName}. Pasando al siguiente...`);
                } else {
                    console.log(`❌ Falló FOTO ${modelName}: ${error.status || error.message}`);
                }
            }
        }

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (foodData) {
            if (foodData.error) return res.status(400).json({ message: foodData.error });
            foodData.calories = Math.round(foodData.calories || 0);
            foodData.protein = Math.round(foodData.protein || 0);
            foodData.carbs = Math.round(foodData.carbs || 0);
            foodData.fat = Math.round(foodData.fat || 0);
            foodData.fiber = Math.round(foodData.fiber || 0);
            return res.json(foodData);
        } else {
            return res.status(503).json({ message: 'Todos los sistemas de visión están saturados. Por favor, intenta introducirlo manualmente o prueba en unos minutos.' });
        }

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error fatal en analyzeImage:", error);
        res.status(500).json({ message: 'Error interno al procesar la imagen.' });
    }
};

// --- GESTIÓN DE LOGS Y COMIDAS ---

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
                food: foodItem._id, name: foodItem.name, calories: foodItem.calories,
                protein: foodItem.protein, carbs: foodItem.carbs, fat: foodItem.fat, fiber: foodItem.fiber || 0
            };
        } else if (rawFood) {
            entryData = {
                name: rawFood.name, calories: rawFood.calories,
                protein: rawFood.protein, carbs: rawFood.carbs, fat: rawFood.fat, fiber: rawFood.fiber || 0
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
        if (!log) log = await NutritionLog.create({ user: req.user._id, date: today, meals: [] });

        const mealBox = log.meals.id(mealId);
        if (!mealBox) return res.status(404).json({ message: 'Caja no encontrada' });

        mealBox.foods.push(finalEntry);

        log.totalCalories += finalEntry.calories;
        log.totalProtein += finalEntry.protein;
        log.totalCarbs += finalEntry.carbs;
        log.totalFat += finalEntry.fat;
        log.totalFiber += finalEntry.fiber;

        await log.save();

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
            merienda: getMealTotal('MERIENDA')
        };

        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: today },
            { nutrition: nutritionBreakdown },
            { upsert: true }
        );

        res.json(log);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Error añadiendo comida' }); }
};

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
        if (!result) return res.status(404).json({ message: 'No encontrado' });
        res.json({ message: 'Eliminado' });
    } catch (error) { res.status(500).json({ message: 'Error eliminando' }); }
};

const updateSavedFood = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, fiber } = req.body;
        const updatedFood = await Food.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { name, calories, protein, carbs, fat, fiber },
            { new: true }
        );
        if (!updatedFood) return res.status(404).json({ message: 'Error' });
        res.json(updatedFood);
    } catch (error) { res.status(500).json({ message: 'Error actualizando' }); }
};

const seedFoods = async (req, res) => { res.json({ message: 'Seed desactivado' }); };

module.exports = {
    getNutritionLog, addFoodEntry, addMealCategory, seedFoods,
    analyzeImage, getSavedFoods, saveCustomFood, deleteSavedFood,
    chatMacroCalculator, updateSavedFood
};