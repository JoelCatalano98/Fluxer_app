const prisma = require('../src/config/prisma');

async function upsertParam(clave, descripcion, tipo, valor) {
    const exists = await prisma.parametroSistema.findFirst({
        where: { clave, branchId: null }
    });
    if (!exists) {
        await prisma.parametroSistema.create({
            data: { clave, descripcion, tipo, valor }
        });
    }
}

async function main() {
    await upsertParam('sueldosHabilitado', 'Habilitar el módulo de Liquidación de Sueldos', 'boolean', 'true');
    await upsertParam('libroDiarioHabilitado', 'Habilitar el módulo de Libro Diario', 'boolean', 'true');
    await upsertParam('sociosHabilitado', 'Habilitar el módulo de Socios (bonificaciones)', 'boolean', 'false');
    await upsertParam('qrHabilitado', 'Habilitar el módulo de QR (cobros/descarga app)', 'boolean', 'false');
    await upsertParam('bloquearReservaPorMora', 'Bloquear reservas de turnos a clientes morosos (no solo inactivos)', 'boolean', 'true');
    await upsertParam('asignacionMasivaHabilitado', 'Habilitar asignación masiva (pádel/Pilates)', 'boolean', 'true');
    await upsertParam('cupoEstricto', 'Bloquear reservas si el cupo está lleno (en lugar de solo avisar en backend)', 'boolean', 'true');
    await upsertParam('multiSucursalHabilitado', 'Habilitar el módulo multi-sucursal', 'boolean', 'false');
    await upsertParam('multiDisciplinaHabilitado', 'Habilitar asignación de múltiples disciplinas por cliente', 'boolean', 'false');
    await upsertParam('libroRutinasHabilitado', 'Habilitar el módulo de Libro de Rutinas', 'boolean', 'false');
    await upsertParam('ocultarInscriptosHabilitado', 'Ocultar en la app de socios la lista de inscriptos por horario', 'boolean', 'false');

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
