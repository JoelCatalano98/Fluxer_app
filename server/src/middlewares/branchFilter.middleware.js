const { getMultiSucursalEnabled } = require('../config/branchCache');
const { prismaBase, createPrismaWithBranch } = require('../config/prismaExtended');

/**
 * branchFilter — middleware central de filtrado por sucursal.
 *
 * Comportamiento según el flag multiSucursalHabilitado:
 *
 *   false (default — instalaciones existentes):
 *     → req.db = prismaBase (sin filtros). Comportamiento 100% idéntico al actual.
 *     → req.branchId = null
 *
 *   true (instalaciones que corrieron /api/branches/initialize):
 *     → Exige branchId en el JWT (req.user.branchId)
 *     → req.db = instancia extendida que filtra por branchId en read/write
 *     → req.branchId = branchId del JWT
 *
 * El backend NUNCA lee branchId de headers, query params, o body —
 * siempre viene de req.user.branchId (JWT decodificado por verifyToken).
 */
const branchFilter = async (req, res, next) => {
    try {
        const isEnabled = await getMultiSucursalEnabled();

        if (!isEnabled) {
            // Feature apagada → comportamiento idéntico al actual
            req.db = prismaBase;
            req.branchId = null;
            return next();
        }

        // Feature activa → exigir branchId en el JWT
        const branchId = req.user?.branchId;
        if (!branchId) {
            return res.status(403).json({
                success: false,
                message: 'Se requiere seleccionar una sucursal activa antes de continuar'
            });
        }

        req.db = createPrismaWithBranch(branchId);
        req.branchId = branchId;
        next();
    } catch (error) {
        console.error('[branchFilter] Error al verificar flag multi-sucursal:', error);
        // Ante error de lectura del flag, no bloquear — usar instancia base
        // para evitar que un fallo de DB deje el sistema inaccesible.
        req.db = prismaBase;
        req.branchId = null;
        next();
    }
};

module.exports = { branchFilter };
