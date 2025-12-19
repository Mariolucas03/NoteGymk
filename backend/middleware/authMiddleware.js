const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener el token del header
            token = req.headers.authorization.split(' ')[1];

            // Verificación de seguridad extra
            if (!process.env.JWT_SECRET) {
                throw new Error('FATAL: JWT_SECRET no definido en entorno');
            }

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Obtener el usuario del token (buscando en BD para tener datos frescos)
            // Nota: decoded.id o decoded.user.id depende de cómo firmaste el token en authController.
            // Generalmente es decoded.id si firmaste { id: user._id }
            // O decoded.user.id si firmaste { user: { id: user._id } }
            // Aquí asumimos que el ID está directo o dentro de user:
            const userId = decoded.id || decoded.user?.id || decoded.user;

            req.user = await User.findById(userId).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Usuario no encontrado');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('No autorizado, token fallido');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('No autorizado, no hay token');
    }
});

// ⚠️ IMPORTANTE: Exportamos la función directamente para que coincida con tu require
module.exports = protect;