const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

// Obtener clientes (listar con paginación / filtrar por socios_activos / filtrar por morosos)
router.get('/', clientesController.getClientes);

// Crear un nuevo cliente
router.post('/', clientesController.createCliente);

// Actualizar un cliente por ID
router.put('/:id', clientesController.updateCliente);

// Dar de baja lógica un cliente por ID (estado_cliente = 'INACTIVO')
router.delete('/:id', clientesController.deleteCliente);

// Actualizar únicamente el estado de pago de un cliente por ID
router.patch('/:id/estado-pago', clientesController.updateEstadoPago);

// Blanquear la contraseña de un cliente por ID (resetea a "123456")
router.patch('/:id/reset-password', clientesController.resetPasswordCliente);

module.exports = router;
