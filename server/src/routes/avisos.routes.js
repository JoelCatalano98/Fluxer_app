const express = require('express');
const router = express.Router();
const { getAvisosAdmin, createAviso, updateAviso, deleteAviso } = require('../controllers/avisos.controller');

router.get('/', getAvisosAdmin);
router.post('/', createAviso);
router.put('/:id', updateAviso);
router.delete('/:id', deleteAviso);

module.exports = router;
