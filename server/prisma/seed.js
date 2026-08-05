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
