const User = require('../models/User');

const checkStreak = async (req, res, next) => {
    // Si no hay usuario (protección extra), pasamos
    if (!req.user) return next();

    try {
        const user = await User.findById(req.user._id);
        if (!user) return next();

        const now = new Date();
        // Usamos formato ISO (YYYY-MM-DD) para comparar solo los días, ignorando horas
        const todayStr = now.toISOString().split('T')[0];

        // Obtenemos la fecha del último log (si no existe, usamos una fecha muy vieja)
        const lastLogDate = user.streak.lastLogDate ? new Date(user.streak.lastLogDate) : new Date(0);
        const lastLogStr = lastLogDate.toISOString().split('T')[0];

        // 1. Si la fecha guardada es HOY, no hacemos nada (ya se contó la racha)
        if (todayStr === lastLogStr) {
            return next();
        }

        // 2. Calculamos la fecha de AYER
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // 3. Lógica de Racha
        if (lastLogStr === yesterdayStr) {
            // Si el último log fue ayer -> Sumamos racha
            user.streak.current += 1;
            console.log(`🔥 Racha aumentada para ${user.username}: ${user.streak.current}`);
        } else {
            // Si el último log fue anteayer o antes -> Reiniciamos a 1
            // (Nota: Si es un usuario nuevo, streak ya es 1 por defecto, así que se queda en 1)
            user.streak.current = 1;
            console.log(`❄️ Racha reiniciada para ${user.username}`);
        }

        // 4. Guardamos la fecha de HOY como último log
        user.streak.lastLogDate = now;
        await user.save();

        // Actualizamos el usuario en la request
        req.user = user;
        next();

    } catch (error) {
        console.error("Error en streakMiddleware:", error);
        next();
    }
};

module.exports = { checkStreak };