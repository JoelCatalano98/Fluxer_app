const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: parsear DateTime @db.Time(0) de Prisma a string "HH:MM"
// Prisma devuelve los campos Time como Date con fecha 1970-01-01 en UTC
const formatTime = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getDashboardMetrics = async (req, res) => {
  try {
    const rango = req.query.rango || 'semanal';

    // ─── 1. Rango temporal ───────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startOfRange, endOfRange;

    if (rango === 'mensual') {
      startOfRange = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfRange.setHours(23, 59, 59, 999);
    } else {
      // Semanal: Lunes 00:00 → Domingo 23:59
      const dayOfWeek = today.getDay(); // 0=Dom, 1=Lun...
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfRange = new Date(today);
      startOfRange.setDate(today.getDate() + diffToMonday);
      startOfRange.setHours(0, 0, 0, 0);

      endOfRange = new Date(startOfRange);
      endOfRange.setDate(startOfRange.getDate() + 6);
      endOfRange.setHours(23, 59, 59, 999);
    }

    // ─── 2. Clientes activos con categoría y plan ────────────
    // Schema: estado_cliente es Enum EstadoCliente { ACTIVO, INACTIVO }
    // Schema: es_socio es Boolean
    // Schema: Plan.precio es Decimal @db.Decimal(10,2) → Prisma lo devuelve como Prisma.Decimal
    const clientes = await prisma.cliente.findMany({
      where: {
        estado_cliente: 'ACTIVO'
      },
      include: {
        categoria: {
          include: {
            plan: true
          }
        }
      }
    });

    let totalSocios = 0;
    let ingresosProyectados = 0;
    const disciplinaMap = {};
    const planMap = {};

    clientes.forEach(cliente => {
      // Solo contar socios activos para el KPI de "Clientes Activos"
      if (cliente.es_socio) {
        totalSocios++;
      }

      // Agrupar por nombre de categoría (todos los clientes activos, sean socios o no)
      if (cliente.categoria) {
        const catName = cliente.categoria.nombre || 'Sin Categoría';
        disciplinaMap[catName] = (disciplinaMap[catName] || 0) + 1;

        if (cliente.categoria.plan) {
          // Forzar conversión: Prisma.Decimal → Number
          const precio = Number(cliente.categoria.plan.precio) || 0;
          ingresosProyectados += precio;

          const planName = cliente.categoria.plan.nombre || 'Plan Sin Nombre';
          planMap[planName] = (planMap[planName] || 0) + precio;
        }
      }
    });

    const clientesPorDisciplina = Object.entries(disciplinaMap)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const ingresosPorPlan = Object.entries(planMap)
      .map(([name, ingresos]) => ({ name, ingresos }))
      .sort((a, b) => b.ingresos - a.ingresos);

    // ─── 3. Turnos en el rango (Horarios Populares) ──────────
    // Schema: TurnoCliente.fecha es DateTime @db.Date → Prisma acepta Date objects para gte/lte
    // Schema: TurnoCliente NO tiene campo "estado" ni "activo" → todos los registros son agendados
    const turnosEnRango = await prisma.turnoCliente.findMany({
      where: {
        fecha: {
          gte: startOfRange,
          lte: endOfRange
        }
      },
      include: {
        horario: true
      }
    });

    const turnosTotales = turnosEnRango.length;

    // Agrupar por franja horaria
    // Schema: HorarioConfig.hora_inicio/hora_fin son DateTime @db.Time(0)
    const horariosMap = {};
    turnosEnRango.forEach(turno => {
      if (turno.horario) {
        const inicio = formatTime(turno.horario.hora_inicio);
        const fin = formatTime(turno.horario.hora_fin);
        const franja = `${inicio} - ${fin}`;
        horariosMap[franja] = (horariosMap[franja] || 0) + 1;
      }
    });

    const horariosPopulares = Object.entries(horariosMap)
      .map(([name, turnos]) => ({ name, turnos }))
      .sort((a, b) => {
        // Ordenar cronológicamente por hora de inicio
        const horaA = a.name.split(' - ')[0];
        const horaB = b.name.split(' - ')[0];
        return horaA.localeCompare(horaB);
      });

    // ─── 4. Respuesta ────────────────────────────────────────
    res.json({
      success: true,
      data: {
        kpis: {
          totalSocios,
          ingresosProyectados,
          turnosSemana: turnosTotales
        },
        clientesPorDisciplina,
        ingresosPorPlan,
        horariosPopulares
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard metrics' });
  }
};

module.exports = {
  getDashboardMetrics
};
