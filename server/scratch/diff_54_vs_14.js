const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });
const fs = require('fs');

async function main() {
    // Current base is RESTORED ORIGINAL (583 movs)
    const clientes = await prisma.cliente.findMany({
        include: { plan: true, movimientocuenta: { orderBy: { fecha: 'asc' } } },
        orderBy: { id: 'asc' }
    });

    const corteAr = new Date(Date.UTC(2026, 10, 10, 26, 59, 59, 999));

    // The 14 clients who also covered in the dirty DB:
    const ids14 = [13, 18, 22, 23, 31, 34, 56, 98, 112, 118, 134, 154, 168, 203];

    const los54 = [];
    const los40Diferencia = [];

    for (const c of clientes) {
        const cuota = c.plan ? parseFloat(c.plan.precio) : 0;
        let saldoAlCorteOriginal = 0;
        const movsConsiderados = [];

        for (const m of c.movimientocuenta) {
            if (new Date(m.fecha) <= corteAr) {
                const monto = parseFloat(m.monto);
                if (m.tipo === 'CARGO' || m.tipo === 'RECARGO') saldoAlCorteOriginal -= monto;
                else saldoAlCorteOriginal += monto;
                movsConsiderados.push({ tipo: m.tipo, monto, desc: m.descripcion, fecha: m.fecha.toISOString() });
            }
        }

        const cubreOriginal = saldoAlCorteOriginal >= cuota;
        if (cubreOriginal) {
            los54.push({ id: c.id, nombre: `${c.nombre} ${c.apellido}`.trim(), cuota, saldoAlCorteOriginal });
            if (!ids14.includes(c.id)) {
                // In the dirty DB, their October CARGO (and sometimes RECARGO) was persisted, reducing balance by cuota (or cuota + recargo)
                const saldoAlCorteContaminada = saldoAlCorteOriginal - cuota; // because Cargo 10/2026 was added
                los40Diferencia.push({
                    id: c.id,
                    alumno: `${c.nombre} ${c.apellido}`.trim(),
                    cuota,
                    saldoAlCorteOriginal,
                    saldoAlCorteContaminada,
                    movsCount: movsConsiderados.length,
                    movsResumen: movsConsiderados.map(m => `${m.tipo} $${m.monto} (${m.desc})`).join('; ')
                });
            }
        }
    }

    console.log(`Total que cubren en dump original: ${los54.length} (esperado 54)`);
    console.log(`Total diferencia (los que caían en evita recargo y luego no): ${los40Diferencia.length} (esperado 40)`);

    console.table(los40Diferencia.map(d => ({
        ID: d.id,
        Alumno: d.alumno,
        Cuota: d.cuota,
        'Saldo Corte Original': d.saldoAlCorteOriginal,
        'Saldo Corte Sucio': d.saldoAlCorteContaminada,
        'Movimientos al Corte': d.movsResumen
    })));

    fs.writeFileSync('scratch/los_40_clientes.json', JSON.stringify(los40Diferencia, null, 2));

    await prisma.$disconnect();
}

main().catch(console.error);
