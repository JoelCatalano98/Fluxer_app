const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET no está configurado en las variables de entorno.");
}

const BRANCH_SELECTION_SCOPE = 'branch-selection-only';

/**
 * verifyToken — middleware estándar para rutas operativas.
 *
 * Rechaza tokens con scope 'branch-selection-only' — esos tokens temporales
 * solo sirven para POST /api/auth/select-branch y no deben acceder a datos.
 */
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

        // Rechazar tokens de selección de sucursal en rutas operativas
        if (decoded.scope === BRANCH_SELECTION_SCOPE) {
            return res.status(403).json({
                success: false,
                message: 'Token de selección de sucursal no válido para esta ruta'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
};

/**
 * verifyTempToken — middleware exclusivo para POST /api/auth/select-branch.
 *
 * EXIGE que el token tenga scope 'branch-selection-only'.
 * Rechaza tokens completos (sin ese scope) para evitar que se use select-branch
 * con un token ya definitivo.
 */
const verifyTempToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.scope !== BRANCH_SELECTION_SCOPE) {
            return res.status(403).json({
                success: false,
                message: 'Esta ruta requiere un token temporal de selección de sucursal'
            });
        }

        req.user = decoded;
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

const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.esSuperAdmin) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Requiere permisos de super administrador' });
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
    verifyTempToken,
    requireAdmin,
    requireSuperAdmin,
    requirePermiso,
    JWT_SECRET,       // exportado para que auth.controller.js lo use sin re-importar process.env
    BRANCH_SELECTION_SCOPE
};
