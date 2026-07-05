const express = require('express');
const router = express.Router();
const { getNotas, createNota, updateNota, deleteNota } = require('../controllers/calendario.controller');

router.get('/', getNotas);
router.post('/', createNota);
router.put('/:id', updateNota);
router.delete('/:id', deleteNota);

module.exports = router;
