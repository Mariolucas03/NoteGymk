const User = require('../models/User');

const checkStreak = async (req, res, next) => {
    // Si no hay usuario autenticado, pasamos (no debería ocurrir si usas 'protect')
    if (!req.user) return next();

    try {
        const user = await User.findById(req.user._id);
        if (!user) return next();

        const today = new Date();
        // Normalizar fecha a medianoche para comparar solo días
        today.setHours(0, 0, 0, 0);

        const lastLog = user.streak.lastLogDate ? new Date(user.streak.lastLogDate) : new Date(0);
        lastLog.setHours(0, 0, 0, 0);

        // Si la última vez fue HOY, no hacemos nada
        if (today.getTime() === lastLog.getTime()) {
            return next();
        }

        // Si la última vez fue AYER, sumamos racha
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        if (lastLog.getTime() === yesterday.getTime()) {
            // Racha continua
            user.streak.current += 1;
        } else {
            // Se rompió la racha (hace más de 1 día que no entra)
            // PERO: Si es el primer día (lastLog muy viejo), empezamos en 1
            user.streak.current = 1;
        }

        // Actualizamos la fecha de último log a HOY
        user.streak.lastLogDate = new Date(); // Guardamos con hora actual para precisión

        await user.save();

        // Actualizamos el usuario en req para que los siguientes controladores tengan el dato fresco
        req.user = user;

        next();

    } catch (error) {
        console.error("Error actualizando racha:", error);
        next(); // Continuamos aunque falle para no bloquear la app
    }
};

module.exports = { checkStreak };