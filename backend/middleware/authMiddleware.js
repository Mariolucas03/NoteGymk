const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Obtener token del header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar firma del token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');

            // 3. Buscar usuario en BBDD (sin password)
            req.user = await User.findById(decoded.id).select('-password');

            // --- PROTECCIÓN EXTRA: SI EL USUARIO YA NO EXISTE EN DB ---
            if (!req.user) {
                return res.status(401).json({ message: 'Usuario no encontrado (Token inválido)' });
            }
            // ----------------------------------------------------------

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, falta token' });
    }
};

module.exports = { protect };