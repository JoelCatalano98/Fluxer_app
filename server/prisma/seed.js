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
    console.log('Seed completado: parámetros del sistema inicializados.');
}

main()
    .catch((e) => {
        console.error('Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
