const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const { getDashboardMetrics } = require('./src/controllers/dashboard.controller');
  const req = { query: { rango: 'semanal' } };
  const res = { json: (data) => console.log(JSON.stringify(data)), status: () => res };
  await getDashboardMetrics(req, res);
  await prisma.$disconnect();
}
run().catch(console.error);
