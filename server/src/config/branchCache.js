/**
 * branchCache.js — Singleton de cache en memoria para el flag multiSucursalHabilitado.
 *
 * Por qué un módulo separado:
 *   - Node.js cachea los módulos requeridos → el estado (_cachedValue) persiste
 *     en el mismo proceso entre requests.
 *   - invalidateBranchCache() es llamado desde /api/branches/initialize en el mismo
 *     paso donde se setea el flag en DB → garantiza que el próximo request ya lee
 *     el valor actualizado, sin necesidad de reiniciar el proceso.
 */

const prisma = require('./prisma');

let _cachedValue = null; // null = no cargado aún
let _loadedAt = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos — safety net

/**
 * Retorna true si multiSucursalHabilitado = "true" en ParametroSistema.
 * Usa cache con TTL de 5 min; puede invalidarse explícitamente.
 */
const getMultiSucursalEnabled = async () => {
    const now = Date.now();

    // Usar cache si está cargado y dentro del TTL
    if (_cachedValue !== null && (now - _loadedAt) < CACHE_TTL_MS) {
        return _cachedValue;
    }

    // Leer de DB — branchId: null = parámetro global de la instalación
    const param = await prisma.parametroSistema.findFirst({
        where: { clave: 'multiSucursalHabilitado', branchId: null }
    });

    _cachedValue = param?.valor === 'true';
    _loadedAt = now;
    return _cachedValue;
};

/**
 * Invalida la cache — debe llamarse desde /api/branches/initialize
 * ANTES de retornar la respuesta, en el mismo ciclo de request.
 * Esto garantiza que el próximo request al middleware lee el nuevo valor de DB.
 */
const invalidateBranchCache = () => {
    _cachedValue = null;
    _loadedAt = null;
};

/**
 * Fuerza el valor en cache (sin ir a DB).
 * Usado por /initialize para setear true sin esperar el próximo request.
 */
const setBranchCacheValue = (value) => {
    _cachedValue = value;
    _loadedAt = Date.now();
};

module.exports = { getMultiSucursalEnabled, invalidateBranchCache, setBranchCacheValue };
