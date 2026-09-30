const prisma = require('./prisma');

let _cachedValue = null;
let _loadedAt = null;

const CACHE_TTL_MS = 60 * 1000; // 1 minuto TTL

/**
 * Retorna true si ocultarInscriptosHabilitado = "true" en ParametroSistema.
 * Si no está configurado o falla la consulta, retorna false por defecto.
 */
const getOcultarInscriptosEnabled = async (db = prisma) => {
    const now = Date.now();

    if (_cachedValue !== null && (now - _loadedAt) < CACHE_TTL_MS) {
        return _cachedValue;
    }

    try {
        const param = await db.parametroSistema.findFirst({
            where: { clave: 'ocultarInscriptosHabilitado', branchId: null }
        });
        _cachedValue = param?.valor === 'true';
    } catch (err) {
        _cachedValue = false;
    }

    _loadedAt = now;
    return _cachedValue;
};

const invalidateOcultarInscriptosCache = () => {
    _cachedValue = null;
    _loadedAt = null;
};

module.exports = {
    getOcultarInscriptosEnabled,
    invalidateOcultarInscriptosCache
};
