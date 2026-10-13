const fs = require('fs');
const zlib = require('zlib');
const { spawn, execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const mysqlExe = 'C:\\Program Files\\MySQL\\MySQL Workbench 8.0 CE\\mysql.exe';
const dbName = 'fluxer_auditoria';
const gzPath = 'C:\\ProyectosGit\\Fluxer\\Varios\\fluxer_krebs_2026-10-13_1200.sql.gz';

console.log("1. Recreando base " + dbName + "...");
execSync(`"${mysqlExe}" -u root -pFluxer2026!! -e "DROP DATABASE IF EXISTS ${dbName}; CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
console.log("Base recreada.");

console.log("2. Restaurando dump original...");
const mysqlProcess = spawn(mysqlExe, ['-u', 'root', '-pFluxer2026!!', '--default-character-set=utf8mb4', dbName]);
const fileStream = fs.createReadStream(gzPath);
const gunzipStream = zlib.createGunzip();

fileStream.pipe(gunzipStream).pipe(mysqlProcess.stdin);

mysqlProcess.on('close', async (code) => {
    console.log("Restauración finalizada con código:", code);
    if (code === 0) {
        const prisma = new PrismaClient({ datasources: { db: { url: `mysql://root:Fluxer2026!!@localhost:3306/${dbName}` } } });
        const clientesCount = await prisma.cliente.count();
        const movsCount = await prisma.movimientocuenta.count();
        console.log(`Verificación: ${clientesCount} clientes, ${movsCount} movimientos (esperado: 583).`);
        await prisma.$disconnect();
    }
});
