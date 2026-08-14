const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.usuario.findMany();
    console.log("Users:", users);
    
    // Si no hay usuarios, creamos uno de prueba
    if (users.length === 0) {
        const bcrypt = require('bcryptjs');
        const newUser = await prisma.usuario.create({
            data: {
                nombre: 'Admin Test',
                usuario: 'admin',
                email: 'admin@test.com',
                password: bcrypt.hashSync('123456', 10),
                esSuperAdmin: true
            }
        });
        console.log("Created test user:", newUser);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
