const express = require('express');
const router = express.Router();
const {
    initializeBranches,
    getBranches,
    createBranch,
    updateBranch,
    deactivateBranch,
} = require('../controllers/branches.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas las rutas requieren token válido (no branch-selection-only)
router.use(verifyToken);

// Inicialización única de la feature — solo superAdmin
router.post('/initialize', initializeBranches);

// CRUD
router.get('/', getBranches);
router.post('/', createBranch);
router.patch('/:id', updateBranch);
router.delete('/:id', deactivateBranch);

module.exports = router;
