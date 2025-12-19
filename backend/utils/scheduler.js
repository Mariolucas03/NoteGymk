const cron = require('node-cron');
const Mission = require('../models/Mission');
const User = require('../models/User');
const DailyLog = require('../models/DailyLog'); // Importar modelo para guardar fallos

const initScheduledJobs = () => {
    // -----------------------------------------------------------------------
    // CRON PRINCIPAL: Medianoche (00:00)
    // -----------------------------------------------------------------------
    cron.schedule('0 0 * * *', async () => {
        const now = new Date();
        console.log(`🌙 MANTENIMIENTO 00:00 - Fecha: ${now.toISOString()}`);

        try {
            // 1. DETERMINAR QUÉ FRECUENCIAS VENCEN HOY
            // 'daily' siempre vence cada noche
            const frequenciesToPunish = ['daily'];

            // Semanal: Vence la madrugada del Lunes (porque evalúa la semana anterior)
            // getDay(): 0=Domingo, 1=Lunes
            if (now.getDay() === 1) {
                frequenciesToPunish.push('weekly');
            }

            // Mensual: Vence el día 1 de cada mes
            if (now.getDate() === 1) {
                frequenciesToPunish.push('monthly');
            }

            // Anual: Vence el 1 de Enero
            if (now.getDate() === 1 && now.getMonth() === 0) {
                frequenciesToPunish.push('yearly');
            }

            console.log(`⚔️ Evaluando misiones: ${frequenciesToPunish.join(', ')}`);

            // ==========================================
            // 2. FASE DE CASTIGO Y REGISTRO (Daño por NO completar)
            // ==========================================

            // Buscamos CUALQUIER misión (Hábito o Temporal) de las frecuencias activas que NO esté completada
            const failedMissions = await Mission.find({
                frequency: { $in: frequenciesToPunish },
                completed: false
            });

            if (failedMissions.length > 0) {
                const DAMAGE_RULES = { easy: 5, medium: 3, hard: 1, epic: 0 };

                // Agrupar datos por usuario para hacer una sola actualización por persona
                const userUpdates = {}; // { userId: { damage: 0, failedItems: [] } }

                for (const mission of failedMissions) {
                    const uid = mission.user.toString();
                    if (!userUpdates[uid]) userUpdates[uid] = { damage: 0, failedItems: [] };

                    const dmg = DAMAGE_RULES[mission.difficulty] || 0;
                    userUpdates[uid].damage += dmg;

                    // Preparamos el objeto para guardar en el historial (ROJO)
                    userUpdates[uid].failedItems.push({
                        title: mission.title,
                        coinReward: 0,
                        xpReward: 0,
                        gameCoinReward: 0,
                        frequency: mission.frequency,
                        difficulty: mission.difficulty,
                        type: mission.type,
                        failed: true,      // <--- IMPORTANTE: Marca como fallida
                        hpLoss: dmg        // <--- PARA MOSTRAR EN WIDGET
                    });
                }

                // Calcular fecha de "AYER" (porque el cron corre a las 00:00 del día siguiente)
                // Queremos guardar el fallo en el día que ACABA de terminar
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                // Ejecutar actualizaciones
                for (const [userId, data] of Object.entries(userUpdates)) {
                    try {
                        // A. Restar Vida al Usuario
                        const user = await User.findById(userId);
                        if (user) {
                            const oldHp = user.stats.hp || 100;
                            let newHp = Math.max(0, oldHp - data.damage);

                            user.stats.hp = newHp;
                            user.lives = newHp; // Sincronizar legacy
                            await user.save();

                            console.log(`💀 Usuario ${user.username} perdió ${data.damage} HP. Vida: ${newHp}`);
                        }

                        // B. Guardar las misiones fallidas en el Log de AYER
                        if (data.failedItems.length > 0) {
                            await DailyLog.findOneAndUpdate(
                                { user: userId, date: yesterdayStr },
                                {
                                    $push: { 'missionStats.listCompleted': { $each: data.failedItems } },
                                    // Opcional: registrar pérdida total de vida en gains (como negativo o campo aparte)
                                    $inc: { 'gains.lives': -data.damage }
                                },
                                { upsert: true }
                            );
                        }

                    } catch (err) {
                        console.error(`Error procesando usuario ${userId}:`, err);
                    }
                }
            }

            // ==========================================
            // 3. FASE DE LIMPIEZA (Resetear / Borrar)
            // ==========================================
            // Ejecutamos la limpieza solo para las frecuencias que tocan hoy
            for (const freq of frequenciesToPunish) {
                await processCycle(freq);
            }

        } catch (error) {
            console.error('❌ Error crítico en el cron de medianoche:', error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Madrid"
    });
};

// --- FUNCIÓN AUXILIAR PARA PROCESAR LOS CICLOS ---
async function processCycle(frequency) {
    // A) HÁBITOS: Se resetean (Vuelven a aparecer vacíos)
    const habitsResult = await Mission.updateMany(
        { frequency: frequency, type: 'habit' },
        {
            $set: {
                completed: false,
                progress: 0,
                lastUpdated: new Date()
            }
        }
    );
    if (habitsResult.modifiedCount > 0) {
        console.log(`🔄 [${frequency}] ${habitsResult.modifiedCount} Hábitos reseteados.`);
    }

    // B) TEMPORALES: Se eliminan (Desaparecen para siempre)
    const tempResult = await Mission.deleteMany(
        { frequency: frequency, type: 'temporal' }
    );
    if (tempResult.deletedCount > 0) {
        console.log(`🗑️ [${frequency}] ${tempResult.deletedCount} Misiones temporales eliminadas.`);
    }
}

module.exports = initScheduledJobs;