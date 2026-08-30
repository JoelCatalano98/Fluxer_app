const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando creación de administrador...');
    
    const email = 'admin@krebs.com';
    const passwordPlain = 'admin123';
    const usuarioLogin = 'admin';

    try {
        // 1. Verificar si el usuario ya existe para evitar duplicados
        const existeUsuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (existeUsuario) {
            console.log(`❌ El usuario con email ${email} ya existe.`);
            return;
        }

        // 2. Hashear la contraseña con bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordPlain, salt);

        // 3. Crear el usuario con todos los permisos (SuperAdmin)
        const nuevoAdmin = await prisma.usuario.create({
            data: {
                email: email,
                usuario: usuarioLogin,
                password: hashedPassword,
                nombre: 'Administrador Principal',
                esAdmin: true,
                esSuperAdmin: true,
                permisoClientes: true,
                permisoFeriados: true,
                permisoFinanzas: true,
                permisoPlanes: true,
                permisoTurnos: true
            }
        });

        console.log('✅ ¡Éxito! Usuario administrador creado correctamente.');
        console.log(`📧 Email: ${nuevoAdmin.email}`);
        console.log(`👤 Usuario: ${nuevoAdmin.usuario}`);
        console.log(`🔑 Contraseña: ${passwordPlain}`);
        console.log(`🆔 ID BD: ${nuevoAdmin.id}`);
        
    } catch (error) {
        console.error('❌ Error al crear el administrador:', error);
    } finally {
        // 4. Cerrar la conexión a la base de datos
        await prisma.$disconnect();
        console.log('Conexión a la base de datos cerrada.');
    }
}

main();
