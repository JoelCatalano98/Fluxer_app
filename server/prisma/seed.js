const prisma = require('../src/config/prisma');

async function main() {
    await prisma.parametroSistema.upsert({
        where: { clave: 'sueldosHabilitado' },
        update: {},
        create: {
            clave: 'sueldosHabilitado',
            descripcion: 'Habilitar el módulo de Liquidación de Sueldos',
            tipo: 'boolean',
            valor: 'true'
        }
    });
    await prisma.parametroSistema.upsert({
        where: { clave: 'libroDiarioHabilitado' },
        update: {},
        create: {
            clave: 'libroDiarioHabilitado',
            descripcion: 'Habilitar el módulo de Libro Diario',
            tipo: 'boolean',
            valor: 'true'
        }
    });
    await prisma.parametroSistema.upsert({
        where: { clave: 'sociosHabilitado' },
        update: {},
        create: {
            clave: 'sociosHabilitado',
            descripcion: 'Habilitar el módulo de Socios (bonificaciones)',
            tipo: 'boolean',
            valor: 'false'
        }
    });
    await prisma.parametroSistema.upsert({
        where: { clave: 'qrHabilitado' },
        update: {},
        create: {
            clave: 'qrHabilitado',
            descripcion: 'Habilitar el módulo de QR (cobros/descarga app)',
            tipo: 'boolean',
            valor: 'false'
        }
    });
    await prisma.parametroSistema.upsert({
        where: { clave: 'bloquearReservaPorMora' },
        update: {},
        create: {
            clave: 'bloquearReservaPorMora',
            descripcion: 'Bloquear reservas de turnos a clientes morosos (no solo inactivos)',
            tipo: 'boolean',
            valor: 'true'
        }
    });
    // Creación del usuario administrador inicial
    const existeAdmin = await prisma.usuario.findFirst({
        where: { esSuperAdmin: true }
    });

    if (!existeAdmin) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query) => new Promise((resolve) => rl.question(query, resolve));

        console.log();
        console.log('--- Configuración del Administrador Principal ---');
        const adminEmail = await question('Email del administrador: ');
        const adminUsuario = await question('Usuario (login): ');

        let adminPassword = '';
        while (true) {
            adminPassword = await question('Contraseña: ');
            if (adminPassword.length >= 10) {
                break;
            }
            console.log('❌ Error: La contraseña debe tener al menos 10 caracteres. Inténtalo de nuevo.');
        }
        
        rl.close();

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const nuevoAdmin = await prisma.usuario.create({
            data: {
                email: adminEmail,
                usuario: adminUsuario,
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
        console.log(`✅ Administrador creado exitosamente: ${nuevoAdmin.usuario} (${nuevoAdmin.email})`);
    } else {
        console.log(`✅ Ya existe un SuperAdministrador en la base de datos.`);
    }

    console.log('Seed completado: parámetros del sistema y admin inicializados.');
}

main()
    .catch((e) => {
        console.error('Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
