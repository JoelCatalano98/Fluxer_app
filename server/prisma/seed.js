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
    const adminEmail = process.env.ADMIN_EMAIL || 'sadmin@fluxer.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Fluxer2026!!';
    const adminUsuario = process.env.ADMIN_USUARIO || 'admin';

    const existeAdmin = await prisma.usuario.findFirst({
        where: { esSuperAdmin: true }
    });

    if (!existeAdmin) {
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
        console.log(`✅ Administrador creado: ${nuevoAdmin.usuario} (${nuevoAdmin.email})`);
        console.log(`⚠️ IMPORTANTE: Si usaste la contraseña por defecto, cámbiala desde el panel cuanto antes.`);
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
