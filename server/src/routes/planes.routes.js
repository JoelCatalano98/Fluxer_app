const express = require('express');
const router = express.Router();
const planesController = require('../controllers/planes.controller');

// Obtener todos los planes activos
router.get('/', planesController.getPlanes);

// Obtener un plan por ID
router.get('/:id', planesController.getPlanById);

// Crear un nuevo plan
router.post('/', planesController.createPlan);

// Actualizar un plan por ID
router.put('/:id', planesController.updatePlan);

// Dar de baja lógica un plan por ID (activo = false)
router.delete('/:id', planesController.deletePlan);

module.exports = router;
