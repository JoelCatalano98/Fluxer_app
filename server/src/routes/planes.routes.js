const express = require('express');
const router = express.Router();
const planesController = require('../controllers/planes.controller');
const { requirePermiso } = require('../middlewares/auth.middleware');

// Obtener todos los planes activos
router.get('/', planesController.getPlanes);

// Obtener un plan por ID
router.get('/:id', planesController.getPlanById);

// Crear un nuevo plan
router.post('/', requirePermiso('permisoPlanes'), planesController.createPlan);

// Actualizar un plan por ID
router.put('/:id', requirePermiso('permisoPlanes'), planesController.updatePlan);

// Dar de baja lógica un plan por ID (activo = false)
router.delete('/:id', requirePermiso('permisoPlanes'), planesController.deletePlan);

module.exports = router;
