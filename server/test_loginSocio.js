const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const cliente = await prisma.cliente.findFirst({ where: { password: { not: null } } });
    if (!cliente) {
        console.log('No cliente with password');
        return;
    }
    
    // Simular un request con la contraseña real si es posible, o resetearla a algo conocido
    const bcrypt = require('bcryptjs');
    await prisma.cliente.update({
        where: { id: cliente.id },
        data: { password: bcrypt.hashSync('123456', 10) }
    });

    console.log(`Using email: ${cliente.email} and password: 123456`);

    const req = { body: { email: cliente.email, password: '123456' } };
    const res = { 
        status: (code) => ({ json: (data) => console.log('Response:', code, data) }),
        json: (data) => console.log('Response:', 200, data)
    };
    
    const { loginSocio } = require('./src/controllers/authSocio.controller.js');
    await loginSocio(req, res);
}

run().finally(() => prisma.$disconnect());
