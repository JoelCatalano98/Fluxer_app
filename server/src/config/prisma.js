const { PrismaClient } = require('@prisma/client');

// Instancia única de PrismaClient para todo el proyecto
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;
