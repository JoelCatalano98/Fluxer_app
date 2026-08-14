const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function test() {
    // Buscar socio
    const cliente = await prisma.cliente.findFirst({ where: { password: { not: null } } });
    if (!cliente) return console.log('No cliente');
    
    // Setear a 123456
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.cliente.update({
        where: { id: cliente.id },
        data: { password: hashedPassword }
    });
    
    const req = { body: { email: cliente.email, password: '123456' } };
    const res = { 
        status: (code) => ({ json: (data) => console.log('Response:', code, data) }),
        json: (data) => console.log('Response:', 200, data)
    };
    
    const { loginSocio } = require('./src/controllers/authSocio.controller.js');
    await loginSocio(req, res);
}

test().finally(() => {
    prisma.$disconnect();
});
