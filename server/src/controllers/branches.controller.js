const prisma = require('../config/prisma');
const { invalidateBranchCache, setBranchCacheValue } = require('../config/branchCache');

/**
 * POST /api/branches/initialize
 *
 * SOLO puede ejecutarse una vez por instalación (cuando multiSucursalHabilitado = false).
 * Protegido por verifyToken + esSuperAdmin.
 *
 * Flujo dentro de una transacción:
 *  1. Verificar que la feature NO esté ya activada
 *  2. Crear la primera Branch
 *  3. UPDATE masivo en todas las tablas afectadas → asignar branchId
 *  4. Crear UsuarioSucursal para todos los usuarios existentes
 *  5. Setear multiSucursalHabilitado = true
 *  6. Invalidar/actualizar cache en memoria
 *  7. Retornar resumen con conteos reales (evidencia)
 */
const initializeBranches = async (req, res) => {
    try {
        if (!req.user?.esSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Solo superAdmin puede inicializar sucursales' });
        }

        const nombreBranch = req.body?.nombre?.trim() || 'Casa Central';
        const direccion = req.body?.direccion?.trim() || null;
        const telefono = req.body?.telefono?.trim() || null;

        // ── Verificar que no esté ya inicializado ──────────────────────────
        const flagExistente = await prisma.parametroSistema.findFirst({
            where: { clave: 'multiSucursalHabilitado', branchId: null }
        });

        if (flagExistente?.valor === 'true') {
            return res.status(409).json({
                success: false,
                message: 'El modo multi-sucursal ya está activado para esta instalación. Usar POST /api/branches para agregar más sucursales.'
            });
        }

        // ── Conteos ANTES (para verificación post-initialize) ──────────────
        const [
            clientesAntes, turnosAntes, movGenAntes, movCtaAntes,
            avisosAntes, categoriasAntes, rutinasAntes, liquidacionesAntes
        ] = await Promise.all([
            prisma.cliente.count(),
            prisma.turnoCliente.count(),
            prisma.movimientoGeneral.count(),
            prisma.movimientocuenta.count(),
            prisma.aviso.count(),
            prisma.categoria.count(),
            prisma.rutina.count(),
            prisma.liquidacion.count(),
        ]);

        // ── Transacción principal ──────────────────────────────────────────
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear la primera Branch
            const branch = await tx.branch.create({
                data: { nombre: nombreBranch, direccion, telefono, activa: true }
            });
            const bId = branch.id;

            // 2. UPDATE masivo en todas las tablas afectadas
            //    Solo registros donde branchId IS NULL (no pisar si ya tienen valor)
            const [
                rClientes, rTurnos, rMovGen, rMovCta,
                rAvisos, rCategorias, rRutinas, rLiquidaciones, rHorarios
            ] = await Promise.all([
                tx.cliente.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.turnoCliente.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.movimientoGeneral.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.movimientocuenta.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.aviso.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.categoria.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.rutina.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.liquidacion.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
                tx.horarioConfig.updateMany({ where: { branchId: null }, data: { branchId: bId } }),
            ]);

            // 3. Crear UsuarioSucursal para todos los usuarios existentes
            const usuarios = await tx.usuario.findMany({ select: { id: true } });
            await tx.usuarioSucursal.createMany({
                data: usuarios.map(u => ({ usuarioId: u.id, branchId: bId, rol: 'admin' })),
                skipDuplicates: true,
            });

            // 4. Activar el flag en DB
            await tx.parametroSistema.update({
                where: { clave_branchId: { clave: 'multiSucursalHabilitado', branchId: null } },
                data: { valor: 'true' }
            });

            return {
                branch,
                usuariosAsignados: usuarios.length,
                filasActualizadas: {
                    clientes: rClientes.count,
                    turnosCliente: rTurnos.count,
                    movimientosGenerales: rMovGen.count,
                    movimientosCuenta: rMovCta.count,
                    avisos: rAvisos.count,
                    categorias: rCategorias.count,
                    rutinas: rRutinas.count,
                    liquidaciones: rLiquidaciones.count,
                    horariosConfig: rHorarios.count,
                }
            };
        });

        // ── Invalidar cache ANTES de responder ────────────────────────────
        // El próximo request al middleware ya va a leer el nuevo valor de DB.
        setBranchCacheValue(true); // Setear directamente en cache sin esperar TTL
        invalidateBranchCache();   // Limpiar por si setBranchCacheValue no llega a tiempo

        // ── Conteos DESPUÉS (verificación de no-interferencia) ────────────
        const [
            clientesDespues, turnosDespues, movGenDespues, movCtaDespues
        ] = await Promise.all([
            prisma.cliente.count(),
            prisma.turnoCliente.count(),
            prisma.movimientoGeneral.count(),
            prisma.movimientocuenta.count(),
        ]);

        console.log('[INITIALIZE] Verificación de integridad:');
        console.log(`  clientes: ${clientesAntes} → ${clientesDespues} (delta: ${clientesDespues - clientesAntes})`);
        console.log(`  turnos: ${turnosAntes} → ${turnosDespues} (delta: ${turnosDespues - turnosAntes})`);
        console.log(`  movimientos_generales: ${movGenAntes} → ${movGenDespues} (delta: ${movGenDespues - movGenAntes})`);
        console.log(`  movimientocuenta: ${movCtaAntes} → ${movCtaDespues} (delta: ${movCtaDespues - movCtaAntes})`);

        // Si hay delta != 0 en cualquiera de estas tablas, algo insertó filas — alertar
        const deltas = {
            clientes: clientesDespues - clientesAntes,
            turnos: turnosDespues - turnosAntes,
            movimientosGenerales: movGenDespues - movGenAntes,
            movimientosCuenta: movCtaDespues - movCtaAntes,
        };
        const filasInEsperadas = Object.entries(deltas).filter(([, d]) => d !== 0);
        if (filasInEsperadas.length > 0) {
            console.warn('[INITIALIZE] ⚠️  DELTA INESPERADO — revisar manualmente:', filasInEsperadas);
        }

        return res.status(200).json({
            success: true,
            message: 'Modo multi-sucursal activado correctamente',
            data: {
                ...resultado,
                verificacionIntegridad: {
                    todosLosDeltasCero: filasInEsperadas.length === 0,
                    deltas,
                }
            }
        });

    } catch (error) {
        console.error('[INITIALIZE] Error:', error);
        return res.status(500).json({ success: false, message: 'Error al inicializar multi-sucursal', error: error.message });
    }
};

/**
 * GET /api/branches
 * Lista todas las sucursales activas. Protegido por verifyToken.
 */
const getBranches = async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { activa: true },
            orderBy: { createdAt: 'asc' }
        });
        return res.status(200).json({ success: true, data: branches });
    } catch (error) {
        console.error('Error en getBranches:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener sucursales' });
    }
};

/**
 * POST /api/branches
 * Crea una sucursal nueva. Solo disponible si multiSucursal ya está activo.
 * Protegido por verifyToken + esSuperAdmin.
 */
const createBranch = async (req, res) => {
    try {
        if (!req.user?.esSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Solo superAdmin puede crear sucursales' });
        }

        const { nombre, direccion, telefono } = req.body;
        if (!nombre?.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre de la sucursal es requerido' });
        }

        const branch = await prisma.branch.create({
            data: {
                nombre: nombre.trim(),
                direccion: direccion?.trim() || null,
                telefono: telefono?.trim() || null,
            }
        });

        return res.status(201).json({ success: true, data: branch, message: 'Sucursal creada correctamente' });
    } catch (error) {
        console.error('Error en createBranch:', error);
        return res.status(500).json({ success: false, message: 'Error al crear sucursal' });
    }
};

/**
 * PATCH /api/branches/:id
 * Edita nombre, dirección o teléfono de una sucursal.
 * Protegido por verifyToken + esSuperAdmin.
 */
const updateBranch = async (req, res) => {
    try {
        if (!req.user?.esSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Solo superAdmin puede editar sucursales' });
        }

        const id = parseInt(req.params.id);
        const { nombre, direccion, telefono } = req.body;

        const branch = await prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Sucursal no encontrada' });
        }

        const updated = await prisma.branch.update({
            where: { id },
            data: {
                ...(nombre?.trim() && { nombre: nombre.trim() }),
                ...(direccion !== undefined && { direccion: direccion?.trim() || null }),
                ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
            }
        });

        return res.status(200).json({ success: true, data: updated, message: 'Sucursal actualizada' });
    } catch (error) {
        console.error('Error en updateBranch:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar sucursal' });
    }
};

/**
 * DELETE /api/branches/:id  (soft delete — activa = false)
 * No elimina datos, solo desactiva la sucursal.
 * No se puede desactivar si es la única sucursal activa.
 * Protegido por verifyToken + esSuperAdmin.
 */
const deactivateBranch = async (req, res) => {
    try {
        if (!req.user?.esSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Solo superAdmin puede desactivar sucursales' });
        }

        const id = parseInt(req.params.id);

        const branch = await prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Sucursal no encontrada' });
        }
        if (!branch.activa) {
            return res.status(400).json({ success: false, message: 'La sucursal ya está inactiva' });
        }

        // Proteger: no desactivar si es la única activa
        const activas = await prisma.branch.count({ where: { activa: true } });
        if (activas <= 1) {
            return res.status(400).json({
                success: false,
                message: 'No se puede desactivar la única sucursal activa de la instalación'
            });
        }

        await prisma.branch.update({ where: { id }, data: { activa: false } });

        return res.status(200).json({ success: true, message: 'Sucursal desactivada correctamente' });
    } catch (error) {
        console.error('Error en deactivateBranch:', error);
        return res.status(500).json({ success: false, message: 'Error al desactivar sucursal' });
    }
};

module.exports = {
    initializeBranches,
    getBranches,
    createBranch,
    updateBranch,
    deactivateBranch,
};
