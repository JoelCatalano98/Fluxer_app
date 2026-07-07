const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getRanking = async (req, res) => {
  try {
    const { ejercicio } = req.query;
    if (!ejercicio) {
      return res.status(400).json({ success: false, error: 'Debe especificar el ejercicio' });
    }

    const records = await prisma.record.findMany({
      where: { ejercicio },
      take: 20,
      orderBy: { pesoMaximo: 'desc' },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};

exports.getMyRecord = async (req, res) => {
  try {
    const { clienteId, ejercicio } = req.query;
    if (!clienteId || !ejercicio) {
       return res.status(400).json({ success: false, error: 'Faltan parámetros' });
    }
    const record = await prisma.record.findUnique({
      where: {
        clienteId_ejercicio: {
          clienteId: Number(clienteId),
          ejercicio
        }
      }
    });
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error al obtener mi récord:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};

exports.upsertRecord = async (req, res) => {
  try {
    let { clienteId, ejercicio, pesoMaximo } = req.body;
    
    if (!clienteId || !ejercicio || pesoMaximo === undefined) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    if (clienteId === 'profesor') {
      let adminCliente = await prisma.cliente.findUnique({
        where: { dni_cuit: 'PROFESOR-ADMIN' }
      });

      if (!adminCliente) {
        adminCliente = await prisma.cliente.create({
          data: {
            nombre: 'Profesor',
            apellido: 'Administrador',
            dni_cuit: 'PROFESOR-ADMIN',
            es_socio: false
          }
        });
      }
      clienteId = adminCliente.id;
    } else {
      clienteId = Number(clienteId);
    }

    const record = await prisma.record.upsert({
      where: {
        clienteId_ejercicio: {
          clienteId,
          ejercicio
        }
      },
      update: {
        pesoMaximo: Number(pesoMaximo),
        fecha: new Date()
      },
      create: {
        clienteId,
        ejercicio,
        pesoMaximo: Number(pesoMaximo)
      }
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error al guardar el récord:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};
