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

    if (!param) {
        console.warn('⚠️ [BranchCache] Parámetro multiSucursalHabilitado no encontrado en DB. Se asume false por seguridad. Corra el seed.');
    }

    let isEnabled = param?.valor === 'true';

    // -------------------------------------------------------------
    // SALVAGUARDA DE INTEGRIDAD
    // Si el flag está activo, confirmar que exista al menos 1 sucursal activa.
    // Si no hay ninguna, forzar fallback a false para evitar rotura sistémica.
    // -------------------------------------------------------------
    if (isEnabled) {
        const branchCount = await prisma.branch.count({ where: { activa: true } });
        if (branchCount === 0) {
            console.error('CRITICAL [BranchCache] Flag multiSucursalHabilitado está en true PERO no hay sucursales activas en la base. Actuando como false (fallback) para evitar rotura total.');
            isEnabled = false;
        }
    }

    _cachedValue = isEnabled;
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
