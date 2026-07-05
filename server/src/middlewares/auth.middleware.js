const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fluxer_key_123';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Guardar payload en la petición
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user && (req.user.esAdmin || req.user.esSuperAdmin)) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Requiere permisos de administrador' });
    }
};

const requirePermiso = (permiso) => {
    return (req, res, next) => {
        if (req.user && (req.user.esSuperAdmin || req.user.esAdmin || req.user[permiso])) {
            next();
        } else {
            return res.status(403).json({ success: false, message: `No tienes permisos para esta acción (${permiso})` });
        }
    };
};

module.exports = {
    verifyToken,
    requireAdmin,
    requirePermiso
};
