const cron = require('node-cron');
const Mission = require('../models/Mission');
const User = require('../models/User');

const initScheduledJobs = () => {
    // -----------------------------------------------------------------------
    // TAREA: Reiniciar a las 00:00 (Medianoche)
    // El patrón '0 0 * * *' significa: Minuto 0, Hora 0, Todos los días
    // -----------------------------------------------------------------------
    cron.schedule('0 0 * * *', async () => {
        console.log('🌙 Ejecutando mantenimiento de medianoche...');

        try {
            // 1. RESETEAR MISIONES DIARIAS
            // Buscamos todas las misiones que sean 'daily' y las ponemos en completed: false
            const missionsResult = await Mission.updateMany(
                { frequency: 'daily' },
                { $set: { completed: false } }
            );
            console.log(`✅ ${missionsResult.modifiedCount} misiones diarias reiniciadas.`);

            // 2. (OPCIONAL) RESETEAR RECOMPENSA DIARIA DE USUARIOS
            // Si quieres que el usuario pueda volver a reclamar su premio diario
            // Esto depende de tu lógica, pero aquí podrías limpiar flags si los tuvieras.

            // Nota: El widget de Racha no necesita reset, se calcula solo al pedir el perfil.
            // Nota: Los widgets de Nutrición, Deporte, Sueño y Ánimo se "resetean" solos
            // porque se guardan en DailyLog vinculados a la fecha. Al cambiar la fecha,
            // el sistema carga una hoja nueva vacía.

        } catch (error) {
            console.error('❌ Error en el cron de medianoche:', error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Madrid" // Ajusta a tu zona horaria (ej: America/Mexico_City, Europe/Madrid)
    });
};

module.exports = initScheduledJobs;