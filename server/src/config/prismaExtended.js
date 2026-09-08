const { PrismaClient } = require('@prisma/client');
const { getMultiSucursalEnabled } = require('./branchCache');

// ─── Modelos con branchId que requieren filtrado automático ───────────────────
// Usados por la Client Extension para interceptar operaciones de lectura y escritura.
const BRANCH_SCOPED_MODELS = [
    'cliente', 'categoria', 'horarioConfig', 'turnoCliente',
    'movimientocuenta', 'movimientoGeneral', 'liquidacion', 'aviso', 'rutina'
];

// ─── Instancia base (sin filtrado) ───────────────────────────────────────────
// Usada cuando multiSucursalHabilitado = false, o directamente por /initialize.
const prismaBase = new PrismaClient();

/**
 * Crea una instancia de Prisma extendida que filtra automáticamente por branchId.
 *
 * Cubre:
 *   - findMany, findFirst, findUnique → inyecta where.branchId
 *   - create                          → inyecta data.branchId
 *   - update                          → reescribe como updateMany({ where: { id, branchId } })
 *   - delete                          → reescribe como deleteMany({ where: { id, branchId } })
 *
 * Limitación conocida del SDK (documentada en prisma/prisma#18276):
 *   El objeto `tx` dentro de $transaction(async (tx) => {}) NO hereda la extension.
 *   Los callbacks de transacción que crean registros en modelos con branchId
 *   deben inyectar branchId manualmente en los datos (ver cargos.service.js,
 *   liquidaciones.controller.js).
 *
 * @param {number} branchId - ID de la sucursal activa del usuario autenticado.
 * @returns Instancia extendida de Prisma
 */
const createPrismaWithBranch = (branchId) => {
    const modelExtensions = Object.fromEntries(
        BRANCH_SCOPED_MODELS.map(model => [
            model,
            {
                // ── LECTURAS ─────────────────────────────────────────────────
                async findMany({ args, query }) {
                    if (branchId) args.where = { ...args.where, branchId };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    if (branchId) args.where = { ...args.where, branchId };
                    return query(args);
                },
                // findUnique: branchId actúa como filtro adicional sobre el campo único.
                // Si el registro existe pero pertenece a otra sucursal → retorna null.
                async findUnique({ args, query }) {
                    if (branchId) args.where = { ...args.where, branchId };
                    return query(args);
                },

                // ── ESCRITURAS ───────────────────────────────────────────────
                async create({ args, query }) {
                    if (branchId) args.data = { ...args.data, branchId };
                    return query(args);
                },

                // update → reescrito como updateMany para incluir branchId en where.
                // Si count === 0: el registro no existe O pertenece a otra sucursal.
                // Lanza error compatible con error.code === 'P2025' (patrón de todos los controllers).
                async update({ args, query, model }) {
                    if (!branchId) return query(args);

                    const result = await prismaBase[model].updateMany({
                        where: { id: args.where.id, branchId },
                        data: args.data
                    });

                    if (result.count === 0) {
                        const err = new Error(`Record not found in branch ${branchId} (model: ${model})`);
                        err.code = 'P2025';
                        throw err;
                    }
                    // Retorna el objeto actualizado — mismo contrato que update nativo.
                    return prismaBase[model].findUnique({ where: { id: args.where.id } });
                },

                // delete → reescrito como deleteMany para incluir branchId en where.
                // Retorna stub { id } — los controllers que lean el objeto retornado
                // de delete() están identificados por el grep de Fase 3 y ajustados.
                async delete({ args, model }) {
                    if (!branchId) {
                        return prismaBase[model].delete({ where: args.where });
                    }

                    const result = await prismaBase[model].deleteMany({
                        where: { id: args.where.id, branchId }
                    });

                    if (result.count === 0) {
                        const err = new Error(`Record not found in branch ${branchId} (model: ${model})`);
                        err.code = 'P2025';
                        throw err;
                    }
                    // delete nativo retorna el objeto — aquí ya fue borrado.
                    // Retornamos stub con id para mantener compatibilidad básica.
                    return { id: args.where.id };
                }
            }
        ])
    );

    return prismaBase.$extends({ query: modelExtensions });
};

module.exports = { prismaBase, createPrismaWithBranch, BRANCH_SCOPED_MODELS };
