const cron = require('node-cron');
const Mission = require('../models/Mission');

const initScheduledJobs = () => {
    // -----------------------------------------------------------------------
    // CRON PRINCIPAL: Se ejecuta TODOS los días a las 00:00 (Medianoche)
    // -----------------------------------------------------------------------
    cron.schedule('0 0 * * *', async () => {
        const now = new Date();
        console.log(`🌙 MANTENIMIENTO 00:00 - Fecha: ${now.toISOString()}`);

        try {
            // ==========================================
            // 1. CICLO DIARIO (Se ejecuta SIEMPRE)
            // ==========================================
            await processCycle('daily');

            // ==========================================
            // 2. CICLO SEMANAL (Solo Lunes a las 00:00)
            // ==========================================
            // getDay(): 0=Domingo, 1=Lunes. Queremos resetear la madrugada del Lunes.
            if (now.getDay() === 1) {
                console.log("📅 Fin de semana detectado. Procesando semanal...");
                await processCycle('weekly');
            }

            // ==========================================
            // 3. CICLO MENSUAL (Solo día 1 del mes)
            // ==========================================
            if (now.getDate() === 1) {
                console.log("📅 Fin de mes detectado. Procesando mensual...");
                await processCycle('monthly');
            }

            // ==========================================
            // 4. CICLO ANUAL (Solo 1 de Enero)
            // ==========================================
            if (now.getDate() === 1 && now.getMonth() === 0) {
                console.log("🎉 Fin de año detectado. Procesando anual...");
                await processCycle('yearly');
            }

        } catch (error) {
            console.error('❌ Error crítico en el cron de medianoche:', error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Madrid" // Ajusta a tu zona horaria real
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
                lastUpdated: new Date() // Marca de tiempo nueva
            }
        }
    );
    if (habitsResult.modifiedCount > 0) {
        console.log(`🔄 [${frequency}] ${habitsResult.modifiedCount} Hábitos reseteados.`);
    }

    // B) TEMPORALES: Se eliminan (Desaparecen para siempre)
    // Da igual si se completaron o no, su tiempo expiró.
    const tempResult = await Mission.deleteMany(
        { frequency: frequency, type: 'temporal' }
    );
    if (tempResult.deletedCount > 0) {
        console.log(`🗑️ [${frequency}] ${tempResult.deletedCount} Misiones temporales eliminadas.`);
    }
}

module.exports = initScheduledJobs;