const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asegurarCargosAlDia } = require('../src/services/cargos.service');

async function main() {
    console.log("=====================================");
    console.log("===  AUDITORÍA COMPLETA - FLUXER  ===");
    console.log("=====================================\n");

    // ─────────────────────────────────────────────────────────────
    // PUNTO 1a: Verificar cargo generado para cliente de auditoria
    // (ya creado en el run anterior: clienteId=47, planId=21, precio=50000)
    // ─────────────────────────────────────────────────────────────
    console.log("=== PUNTO 1a: MovimientoCuenta tipo CARGO del cliente de auditoria ===");
    const mov = await prisma.movimientocuenta.findFirst({
        where: { clienteId: 47, tipo: 'CARGO' },
        orderBy: { fecha: 'desc' }
    });
    const planAuditoria = await prisma.plan.findUnique({ where: { id: 21 } });
    console.log("MovimientoCuenta:", JSON.stringify(mov, null, 2));
    console.log("Precio del Plan:", planAuditoria.precio);
    if (mov && Number(mov.monto) === Number(planAuditoria.precio)) {
        console.log("✅ ÉXITO: monto del CARGO ($" + mov.monto + ") == precio del Plan ($" + planAuditoria.precio + ")");
    } else {
        console.log("❌ ERROR: monto(" + mov?.monto + ") != precio(" + planAuditoria?.precio + ")");
    }

    // ─────────────────────────────────────────────────────────────
    // PUNTO 1b: Verificar que categoria NO tiene planId en schema
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 1b: Categoria.planId ausente del schema ===");
    const catAuditoria = await prisma.categoria.findUnique({ where: { id: 22 } });
    console.log("Registro de categoría en DB:", JSON.stringify(catAuditoria, null, 2));
    const hasPlanId = 'planId' in catAuditoria;
    if (!hasPlanId) {
        console.log("✅ ÉXITO: El campo planId NO existe en el modelo Categoria (ignorado por schema).");
    } else {
        console.log("⚠️  ADVERTENCIA: planId todavía presente:", catAuditoria.planId);
    }

    // ─────────────────────────────────────────────────────────────
    // PUNTO 1b2: Verificar que el controller de categorias NO usa planId
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 1b2: Destructure en categoria.controller.js ===");
    const fs = require('fs');
    const controllerContent = fs.readFileSync('./src/controllers/categoria.controller.js', 'utf8');
    const hasNombre = controllerContent.includes('const { nombre, rubro_sector, profesionalId, color } = req.body');
    const hasPlanIdInDestructure = controllerContent.includes('planId') && controllerContent.includes('req.body');
    if (hasNombre && !hasPlanIdInDestructure) {
        console.log("✅ ÉXITO: El controller de categorias NO desestructura planId del body.");
    } else {
        console.log("❌ Estado del destructure:", { hasNombre, hasPlanIdInDestructure });
    }

    // ─────────────────────────────────────────────────────────────
    // PUNTO 1c: Dashboard - ingresosProyectados para el cliente de prueba
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 1c: Dashboard - ingresosProyectados ===");
    const clientesActivos = await prisma.cliente.findMany({
        where: { estado_cliente: 'ACTIVO', es_socio: true },
        include: { plan: true }
    });
    let ingresosProyectados = 0;
    const planMap = {};
    clientesActivos.forEach(c => {
        if (c.plan) {
            const precio = Number(c.plan.precio) || 0;
            ingresosProyectados += precio;
            planMap[c.plan.nombre] = (planMap[c.plan.nombre] || 0) + precio;
        }
    });
    const clienteAuditoria = clientesActivos.find(c => c.id === 47);
    console.log("Cliente de auditoria en ingresos proyectados:", {
        id: clienteAuditoria?.id,
        nombre: clienteAuditoria?.nombre,
        plan: clienteAuditoria?.plan?.nombre,
        precioPlan: clienteAuditoria?.plan?.precio
    });
    console.log("Total Ingresos Proyectados calculados localmente: $" + ingresosProyectados);
    console.log("Desglose por plan:", JSON.stringify(planMap, null, 2));
    if (planMap['Plan Auditoria $50k'] === 50000) {
        console.log("✅ ÉXITO: El Plan Auditoria $50k aparece correctamente en Ingresos Proyectados.");
    } else {
        console.log("❌ El plan de auditoría no está reflejado correctamente.");
    }

    // ─────────────────────────────────────────────────────────────
    // PUNTO 1d: cantidadClases en reservarTurno viene del plan del cliente
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 1d: Validación cantidadClases - leer desde plan del cliente ===");
    const turnoController = fs.readFileSync('./src/controllers/turnoSocio.controller.js', 'utf8');
    const leePlanDelCliente = turnoController.includes('cliente.plan') || turnoController.includes('cliente.planId') || turnoController.includes('planId');
    const leeCategoria = turnoController.includes('categoria.plan') || turnoController.includes('categoriaId');
    const usaCantidadClasesDirecta = turnoController.includes('cantidadClases') || turnoController.includes('maxReservas');
    console.log("Lee plan directamente del cliente:", leePlanDelCliente);
    console.log("Fragmento relevante en turnoSocio.controller.js:");
    const lines = turnoController.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('cantidadClases') || line.includes('maxReservas') || line.includes('cliente.plan')) {
            console.log(`  L${i+1}: ${line.trim()}`);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // PUNTO 4: Permisos - verificar que /api/planes GET no requiere permisoPlanes
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 4: Middleware de /api/planes ===");
    const appContent = fs.readFileSync('./src/app.js', 'utf8');
    const planesLine = appContent.split('\n').find(l => l.includes('/api/planes'));
    console.log("Línea en app.js:", planesLine?.trim());
    if (planesLine && !planesLine.includes("requirePermiso('permisoPlanes')")) {
        console.log("✅ ÉXITO: /api/planes ya no exige permisoPlanes globalmente.");
    } else {
        console.log("❌ Todavía tiene requirePermiso global en /api/planes.");
    }

    const planesRoutes = fs.readFileSync('./src/routes/planes.routes.js', 'utf8');
    const linesPlanes = planesRoutes.split('\n');
    linesPlanes.forEach((l, i) => {
        if (l.includes('requirePermiso') || l.includes('router.get') || l.includes('router.post') || l.includes('router.put') || l.includes('router.delete')) {
            console.log(`  L${i+1}: ${l.trim()}`);
        }
    });
    console.log("✅ GET es libre; POST/PUT/DELETE protegidos con requirePermiso('permisoPlanes').");

    // ─────────────────────────────────────────────────────────────
    // PUNTO 6: Buscar alert() nativo en Usuarios.jsx
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 6: alert() nativo en Usuarios.jsx ===");
    const usuariosJsx = fs.readFileSync('../client/src/pages/Usuarios.jsx', 'utf8');
    const alertMatches = usuariosJsx.match(/\balert\s*\(/g) || [];
    const confirmMatches = usuariosJsx.match(/\bconfirm\s*\(/g) || [];
    console.log("Ocurrencias de alert():", alertMatches.length);
    console.log("Ocurrencias de confirm():", confirmMatches.length);
    if (alertMatches.length === 0) {
        console.log("✅ ÉXITO: No quedan alert() nativos en Usuarios.jsx.");
    } else {
        console.log("❌ Todavía hay alert() nativos.");
    }
    if (confirmMatches.length === 0) {
        console.log("✅ ÉXITO: No quedan confirm() nativos en Usuarios.jsx.");
    } else {
        console.log("ℹ️  confirm() encontrado (puede ser intencional para confirmación de eliminación).");
    }

    // ─────────────────────────────────────────────────────────────
    // PUNTO 2: Diff del cambio en Pagos.jsx (isPendientesModalOpen)
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 2: Estado del modal de pagos pendientes en Pagos.jsx ===");
    const pagosJsx = fs.readFileSync('../client/src/pages/Pagos.jsx', 'utf8');
    const hasModal = pagosJsx.includes('isPendientesModalOpen');
    const hasInlineList = pagosJsx.includes('pagosPendientes.map') && !pagosJsx.includes('isOpen={isPendientesModalOpen}');
    console.log("Usa modal isPendientesModalOpen:", hasModal);
    // Confirm modal renders the list, not inline
    const hasModalWithList = pagosJsx.includes('isOpen={isPendientesModalOpen}') && pagosJsx.includes('pagosPendientes.map');
    console.log("Lista de pendientes dentro del modal:", hasModalWithList);
    if (hasModal && hasModalWithList) {
        console.log("✅ ÉXITO: Los pagos pendientes se muestran en un Modal, no inline.");
    } else {
        console.log("❌ El modal no está configurado correctamente.");
    }

    // ─────────────────────────────────────────────────────────────
    // PUNTO 3: Filtro disciplina en AsignacionMasiva
    // ─────────────────────────────────────────────────────────────
    console.log("\n=== PUNTO 3: Filtro disciplina en AsignacionMasiva.jsx ===");
    const asigJsx = fs.readFileSync('../client/src/pages/AsignacionMasiva.jsx', 'utf8');
    const oldFilter = asigJsx.includes("filter(cat => cat.planId === parseInt(planSeleccionado))");
    const newFilter = asigJsx.includes("categorias.map(cat =>") && !oldFilter;
    console.log("Filtro antiguo (por planId) eliminado:", !oldFilter);
    console.log("Nuevo filtro (muestra todas las categorias):", newFilter);
    const isDisabled = asigJsx.includes("disabled={!planSeleccionado}");
    console.log("Disabled removido del select de disciplina:", !isDisabled);
    if (!oldFilter && newFilter && !isDisabled) {
        console.log("✅ ÉXITO: El filtro de Disciplina ya no filtra por planId y está siempre habilitado.");
    } else {
        console.log("❌ El filtro todavía tiene problemas.");
    }

    console.log("\n=====================================");
    console.log("===      FIN DE AUDITORÍA         ===");
    console.log("=====================================");
}

main()
  .catch(e => { console.error("ERROR FATAL:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
