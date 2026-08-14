const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const pagoPendiente = await prisma.pago.findFirst({ where: { estado: 'PENDIENTE' }});
    if(!pagoPendiente) {
        console.log("No hay pagos pendientes para probar.");
        return;
    }
    console.log("Aprobando pago:", pagoPendiente.id);
    
    const req = { params: { id: pagoPendiente.id }, body: { estado: 'APROBADO' } };
    const res = { 
        status: (code) => ({ json: (data) => console.log('Response:', code, data) }),
        json: (data) => console.log('Response:', 200, data)
    };
    
    const { cambiarEstadoPago } = require('./src/controllers/pagos.controller.js');
    await cambiarEstadoPago(req, res);
}

run().finally(() => prisma.$disconnect());
