const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function test() {
    // Buscar administrador
    const user = await prisma.usuario.findFirst({ where: { usuario: 'admin' } });
    if (user) {
        // Setear a 123456
        const hashedPassword = await bcrypt.hash('123456', 10);
        await prisma.usuario.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        console.log("Admin password reset to 123456!");
    }
}

test().finally(() => {
    prisma.$disconnect();
});
