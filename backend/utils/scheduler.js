const cron = require('node-cron');
const Mission = require('../models/Mission');
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

// Función auxiliar para obtener fecha en String (Zona horaria Madrid)
const getMadridDateString = (dateObj) => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(dateObj);
};

// --- LÓGICA CORE DE CASTIGO (SEPARADA) ---
// Esta función se puede llamar desde el CRON o manualmente desde el botón de Debug
const runNightlyMaintenance = async () => {
    console.log("🌙 EJECUTANDO MANTENIMIENTO NOCTURNO (MANUAL O CRON)...");
    const now = new Date();

    // 1. "Ayer" (El día que estamos evaluando)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getMadridDateString(yesterday);

    try {
        // 2. ¿QUÉ CICLOS VENCIERON?
        // Daily vence siempre. Weekly si ayer fue Domingo. Monthly si hoy es día 1.
        const frequenciesToPunish = ['daily'];
        if (yesterday.getDay() === 0) frequenciesToPunish.push('weekly');

        const tomorrow = new Date(now);
        if (tomorrow.getDate() === 1) frequenciesToPunish.push('monthly');

        console.log(`⚔️ Evaluando ciclos: ${frequenciesToPunish.join(', ')}`);

        // 3. BUSCAR MISIONES FALLIDAS (No completadas)
        // Buscamos misiones de esas frecuencias que NO estén completadas
        const failedMissions = await Mission.find({
            frequency: { $in: frequenciesToPunish },
            completed: false
        });

        if (failedMissions.length > 0) {
            const DAMAGE_RULES = { easy: 5, medium: 10, hard: 20, epic: 50 };
            const userUpdates = {};

            // Agrupar fallos por usuario
            for (const mission of failedMissions) {
                const uid = mission.user.toString();
                if (!userUpdates[uid]) userUpdates[uid] = { damage: 0, failedItems: [] };

                const dmg = DAMAGE_RULES[mission.difficulty] || 5;
                userUpdates[uid].damage += dmg;

                userUpdates[uid].failedItems.push({
                    title: mission.title,
                    coinReward: 0, xpReward: 0, gameCoinReward: 0,
                    frequency: mission.frequency,
                    difficulty: mission.difficulty,
                    type: mission.type,
                    failed: true,
                    hpLoss: dmg
                });
            }

            // APLICAR DAÑO A CADA USUARIO
            for (const [userId, data] of Object.entries(userUpdates)) {
                try {
                    const user = await User.findById(userId);
                    if (user) {
                        const oldHp = user.hp !== undefined ? user.hp : 100;
                        const newHp = Math.max(0, oldHp - data.damage);

                        // 🔥 ACTUALIZAMOS AMBOS CAMPOS (hp y lives) POR SEGURIDAD
                        user.hp = newHp;
                        user.lives = newHp;

                        // Si falla una misión diaria, la racha se reinicia a 0
                        if (data.failedItems.some(m => m.frequency === 'daily')) {
                            user.streak.current = 0;
                        }

                        await user.save();
                        console.log(`💀 Usuario ${user.username} bajó a ${newHp} HP (-${data.damage})`);

                        // Guardar constancia en el DailyLog de "ayer"
                        await DailyLog.findOneAndUpdate(
                            { user: userId, date: yesterdayStr },
                            {
                                $push: { 'missionStats.listCompleted': { $each: data.failedItems } },
                                $inc: { 'gains.lives': -data.damage }
                            },
                            { upsert: true }
                        );
                    }
                } catch (err) {
                    console.error(`Error castigando user ${userId}:`, err);
                }
            }
        } else {
            console.log("✨ Nadie falló misiones ayer.");
        }

        // 4. LIMPIEZA (Resetear hábitos, borrar temporales)
        for (const freq of frequenciesToPunish) {
            await processCycle(freq);
        }

        return { success: true, message: "Mantenimiento ejecutado." };

    } catch (error) {
        console.error('❌ Error crítico en Scheduler:', error);
        return { success: false, error: error.message };
    }
};

// Función auxiliar para resetear misiones
async function processCycle(frequency) {
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDayNum = yesterdayDate.getDay();

    // 1. Resetear Hábitos (Poner completed: false)
    const habitsResult = await Mission.updateMany(
        { frequency: frequency, type: 'habit' },
        { $set: { completed: false, progress: 0, lastUpdated: new Date() } }
    );
    if (habitsResult.modifiedCount > 0) console.log(`🔄 [${frequency}] ${habitsResult.modifiedCount} Hábitos reiniciados.`);

    // 2. Borrar Temporales (Solo si eran de AYER o Todos los días)
    const tempResult = await Mission.deleteMany({
        frequency: frequency,
        type: 'temporal',
        $or: [{ specificDays: { $size: 0 } }, { specificDays: yesterdayDayNum }]
    });
    if (tempResult.deletedCount > 0) console.log(`🗑️ [${frequency}] ${tempResult.deletedCount} Temporales borradas.`);
}

// Inicializador del CRON (Automático a las 4 AM)
const initScheduledJobs = () => {
    cron.schedule('0 4 * * *', async () => {
        await runNightlyMaintenance();
    }, { scheduled: true, timezone: "Europe/Madrid" });
};

// 🔥 IMPORTANTE: Exportamos tanto el init como la función manual
module.exports = { initScheduledJobs, runNightlyMaintenance };