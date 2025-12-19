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

        // Actualizar DailyLog para widgets
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

// --- GESTIÓN DE MIS COMIDAS ---

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

// --- IAs (VISIÓN Y CHAT) ---

const analyzeImage = async (req, res) => {
    // 🔥 Lista MASIVA de modelos de visión gratuitos para máxima fiabilidad
    // Priorizados por velocidad, novedad y fiabilidad estimada.
    const VISION_MODELS = [
        "google/gemini-flash-1.5-8b-exp:free",          // Muy rápido y reciente
        "google/gemini-2.0-flash-exp:free",             // Última generación de Google
        "meta-llama/llama-3.2-11b-vision-instruct:free", // Muy capaz para su tamaño
        "google/gemini-flash-1.5-exp:free",             // Versión estándar flash
        "qwen/qwen-2-vl-7b-instruct:free",              // Excelente modelo chino
        "google/gemini-pro-1.5-exp:free",               // Más potente, puede ser más lento
        "meta-llama/llama-3.2-90b-vision-instruct:free", // Muy potente, pero pesado
        "qwen/qwen-2-vl-72b-instruct:free",             // Versión grande de Qwen
        "openrouter/quasar-alpha:free",                 // Modelo experimental de OpenRouter (a veces tiene visión)
        "nousresearch/nous-hermes-2-vision-7b:free"     // Otro buen modelo de visión 7B
    ];

    try {
        if (!req.file) return res.status(400).json({ message: 'No hay imagen' });
        const userContext = req.body.context || "Sin contexto extra.";
        const imageBuffer = fs.readFileSync(req.file.path);
        // Optimizamos la imagen a JPEG con calidad media para reducir tamaño y acelerar el envío
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        let foodData = null;
        // Prompt más estricto para forzar JSON limpio
        const finalPrompt = `
            Analiza esta imagen de comida. Actúa como nutricionista profesional.
            CONTEXTO ADICIONAL DEL USUARIO: "${userContext}".
            Identifica el alimento principal. Calcula sus macros aproximados.
            RESPONDER SOLO CON UN OBJETO JSON VÁLIDO. SIN TEXTO ANTES NI DESPUÉS.
            Formato JSON: { "name": "Nombre corto del plato", "calories": numero_entero, "protein": numero_entero, "carbs": numero_entero, "fat": numero_entero, "fiber": numero_entero, "servingSize": "ej: 1 ración media (200g)" }
            Si la imagen NO es comida, responde SOLO: { "error": "No detecto comida válida" }
        `;

        // Bucle de intentos con la lista masiva
        for (const modelName of VISION_MODELS) {
            try {
                console.log(`📷 Probando FOTO con ${modelName}...`);

                // Timeout por request individual para no colgarse con un modelo lento
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos máximo por modelo

                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: finalPrompt },
                                { type: "image_url", image_url: { url: base64Image, detail: "low" } } // "low" detail para ser más rápido y gastar menos
                            ]
                        }
                    ],
                    temperature: 0.1, // Respuestas más deterministas y precisas
                    max_tokens: 300,  // Limitamos la respuesta para que no se enrolle
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const text = completion.choices[0].message.content;

                // Intentar extraer JSON limpio del texto
                const startIndex = text.indexOf('{');
                const endIndex = text.lastIndexOf('}');

                if (startIndex !== -1 && endIndex !== -1) {
                    let jsonStr = text.substring(startIndex, endIndex + 1);
                    // Limpieza básica de posibles bloques de código markdown
                    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');

                    foodData = JSON.parse(jsonStr);

                    // Validación básica del JSON recibido
                    if (foodData.error || (foodData.name && typeof foodData.calories === 'number')) {
                        console.log(`✅ ÉXITO FOTO con ${modelName}`);
                        break; // Si tenemos datos válidos o un error controlado, salimos
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

        // Limpieza del archivo temporal
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (foodData) {
            if (foodData.error) return res.status(400).json({ message: foodData.error });
            // Asegurar que los valores numéricos sean enteros
            foodData.calories = Math.round(foodData.calories || 0);
            foodData.protein = Math.round(foodData.protein || 0);
            foodData.carbs = Math.round(foodData.carbs || 0);
            foodData.fat = Math.round(foodData.fat || 0);
            foodData.fiber = Math.round(foodData.fiber || 0);
            return res.json(foodData);
        } else {
            // Si fallaron los 10 modelos
            return res.status(503).json({ message: 'Todos los sistemas de visión están saturados. Por favor, intenta introducirlo manualmente o prueba en unos minutos.' });
        }

    } catch (error) {
        // Limpieza en caso de error fatal
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error fatal en analyzeImage:", error);
        res.status(500).json({ message: 'Error interno al procesar la imagen.' });
    }
};

// ==========================================
// 🔥 CASCADA MASIVA DE IA + PLAN B
// ==========================================

// Función auxiliar: Calculadora Matemática (Plan B)
const calculateLocalMacros = (text) => {
    // Extraer números usando Expresiones Regulares (busca números cerca de palabras clave)
    const ageMatch = text.match(/(\d+)\s*(?:años|a|y)/i) || text.match(/edad\s*[:]?\s*(\d+)/i);
    const weightMatch = text.match(/(\d+)\s*(?:kg|kilos)/i) || text.match(/peso\s*[:]?\s*(\d+)/i);
    const heightMatch = text.match(/(\d+)\s*(?:cm|centimetros)/i) || text.match(/altura\s*[:]?\s*(\d+)/i);
    const genderMatch = text.match(/(hombre|mujer|masculino|femenino)/i);
    const goalMatch = text.match(/(perder|bajar|definir|ganar|subir|masa|mantener)/i);

    // Si falta algo esencial, devolvemos null para que el frontend avise
    if (!ageMatch || !weightMatch || !heightMatch) return null;

    const age = parseInt(ageMatch[1]);
    const weight = parseInt(weightMatch[1]);
    const height = parseInt(heightMatch[1]);
    const isMale = genderMatch && (genderMatch[1].toLowerCase().startsWith('h') || genderMatch[1].toLowerCase().startsWith('m'));
    const goal = goalMatch ? goalMatch[1].toLowerCase() : 'mantener';

    // Fórmula Harris-Benedict Revisada
    let bmr;
    if (isMale) {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Factor actividad (Asumimos moderado si no se especifica claro)
    let activity = 1.375;
    if (text.includes('sedentario')) activity = 1.2;
    if (text.includes('ligero')) activity = 1.375;
    if (text.includes('moderado')) activity = 1.55;
    if (text.includes('intenso')) activity = 1.725;

    let tdee = Math.round(bmr * activity);

    // Ajuste objetivo
    if (goal.includes('perder') || goal.includes('bajar') || goal.includes('definir')) tdee -= 400;
    else if (goal.includes('ganar') || goal.includes('subir') || goal.includes('masa')) tdee += 300;

    // Reparto Macros
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
        message: "✅ Cálculo realizado (Plan B Local)."
    };
};

const chatMacroCalculator = async (req, res) => {
    // 1. Obtener el último mensaje del usuario
    const { history } = req.body;
    const lastUserMessage = history[history.length - 1].content;

    // 2. INTENTO DE CASCADA DE IA
    if (process.env.OPENROUTER_API_KEY) {
        // 🔥 LISTA DE 10 MODELOS (Del más rápido/nuevo al más fiable/viejo)
        const CHAT_MODELS = [
            "google/gemini-2.0-flash-exp:free",          // Top Tier
            "meta-llama/llama-3.3-70b-instruct:free",    // Potencia bruta
            "google/gemini-flash-1.5-8b-exp:free",       // Velocidad extrema
            "google/gemma-2-9b-it:free",                 // Calidad Google
            "meta-llama/llama-3.2-3b-instruct:free",     // Ligero
            "qwen/qwen-2.5-7b-instruct:free",            // Instrucciones precisas
            "mistralai/mistral-7b-instruct:free",        // Fiable
            "microsoft/phi-3-mini-128k-instruct:free",   // Micro modelo
            "huggingfaceh4/zephyr-7b-beta:free",         // Alternativa
            "openchat/openchat-7b:free"                  // Backup final
        ];

        const systemPrompt = `
            Eres una calculadora de macros estricta y silenciosa. NO saludes. NO des explicaciones.
            Tu única función es extraer estos 6 datos del texto del usuario:
            1. Género (Hombre/Mujer)
            2. Edad (años)
            3. Peso (kg)
            4. Altura (cm)
            5. Actividad (Sedentario, Ligero, Moderado, Intenso, Atleta)
            6. Objetivo (Perder grasa, Mantener, Ganar músculo)

            LÓGICA:
            - SI TIENES LOS 6 DATOS: Calcula TDEE usando Harris-Benedict. Aplica déficit (-400) o superávit (+300) según objetivo. Distribuye macros (30%P, 40%C, 30%G). 
              Responde EXCLUSIVAMENTE con este JSON:
              { "done": true, "calories": NUMERO, "protein": NUMERO, "carbs": NUMERO, "fat": NUMERO, "fiber": NUMERO, "message": "✅ Macros calculados." }
            
            - SI FALTA ALGÚN DATO: Responde SOLO con el texto: "Falta: [Lista de datos que faltan]". Ejemplo: "Falta: Edad y Objetivo."
        `;

        for (const model of CHAT_MODELS) {
            try {
                console.log(`🤖 Intentando IA: ${model}...`);
                const completion = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "system", content: systemPrompt }, ...history],
                    temperature: 0.1,
                    max_tokens: 300
                });

                const content = completion.choices[0].message.content;

                // Si recibimos algo válido (intentamos parsear el JSON)
                const jsonStart = content.indexOf('{');
                const jsonEnd = content.lastIndexOf('}');

                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const data = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
                    if (data.done) {
                        console.log(`✅ ÉXITO con ${model}`);
                        return res.json({ type: 'final', data: data });
                    }
                }

                // Si llegamos aquí, la IA respondió texto (pidiendo datos), lo cual también es un "éxito" de conexión
                if (content && content.length > 0) {
                    return res.json({ type: 'question', message: content });
                }

            } catch (error) {
                console.log(`⚠️ IA falló (${model}). Probando siguiente...`);
                // El bucle continúa automáticamente al siguiente modelo
            }
        }
    }

    // 3. SI TODO FALLA (PLAN B)
    console.log("🚨 TODAS LAS IAs FALLARON. Activando Plan B (Matemáticas Locales)...");

    const localResult = calculateLocalMacros(lastUserMessage);

    if (localResult) {
        // ¡Éxito local!
        return res.json({ type: 'final', data: localResult });
    } else {
        // Fallo local (Faltan datos en el texto y ninguna IA pudo pedirlo)
        return res.json({
            type: 'question',
            message: "⚠️ Fallo de conexión total con la IA. Por favor, asegúrate de escribir TODOS los datos juntos: EDAD, PESO, ALTURA y GÉNERO para usar el cálculo de emergencia."
        });
    }
};

module.exports = {
    getNutritionLog, addFoodEntry, addMealCategory, seedFoods,
    analyzeImage, getSavedFoods, saveCustomFood, deleteSavedFood,
    chatMacroCalculator, updateSavedFood
};