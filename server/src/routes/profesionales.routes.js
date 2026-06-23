const express = require('express');
const router = express.Router();
const profesionalesController = require('../controllers/profesionales.controller');

router.get('/', profesionalesController.getProfesionales);
router.post('/', profesionalesController.createProfesional);
router.put('/:id', profesionalesController.updateProfesional);
router.delete('/:id', profesionalesController.deleteProfesional);

module.exports = router;
