require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asegurarCargosAlDia } = require('../src/services/cargos.service');

async function test() {
    console.log("=== COMPROBACIÓN CLIENTES 133 y 163 TRAS PERDÓN ===");
    for (const id of [133, 163]) {
        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: {
                movimientocuenta: { orderBy: { fecha: 'asc' } }
            }
        });
        console.log(`\nCliente ID ${cliente.id} (${cliente.nombre} ${cliente.apellido}):`);
        console.log(`- Saldo actual en BD: $${cliente.saldo}`);
        console.log(`- Estado pago actual: ${cliente.estado_pago}`);
        console.log(`- Vencimiento cuota: ${cliente.vencimientoCuota}`);
        console.log(`- Movimientos:`);
        console.table(cliente.movimientocuenta.map(m => ({
            id: m.id,
            tipo: m.tipo,
            monto: m.monto,
            fecha: m.fecha.toISOString(),
            descripcion: m.descripcion
        })));
    }

    console.log("\n=== EJECUTANDO asegurarCargosAlDia PARA 133 y 163 ===");
    const movsAntes133 = await prisma.movimientocuenta.count({ where: { clienteId: 133 } });
    const movsAntes163 = await prisma.movimientocuenta.count({ where: { clienteId: 163 } });

    await asegurarCargosAlDia(133);
    await asegurarCargosAlDia(163);

    const movsDespues133 = await prisma.movimientocuenta.count({ where: { clienteId: 133 } });
    const movsDespues163 = await prisma.movimientocuenta.count({ where: { clienteId: 163 } });

    console.log(`Cliente 133 movimientos: antes = ${movsAntes133}, despues = ${movsDespues133} (Diferencia: ${movsDespues133 - movsAntes133})`);
    console.log(`Cliente 163 movimientos: antes = ${movsAntes163}, despues = ${movsDespues163} (Diferencia: ${movsDespues163 - movsAntes163})`);

    const c133Post = await prisma.cliente.findUnique({ where: { id: 133 } });
    const c163Post = await prisma.cliente.findUnique({ where: { id: 163 } });
    console.log(`Cliente 133 saldo post asegurarCargosAlDia: $${c133Post.saldo}`);
    console.log(`Cliente 163 saldo post asegurarCargosAlDia: $${c163Post.saldo}`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
