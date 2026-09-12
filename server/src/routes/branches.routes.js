const express = require('express');
const router = express.Router();
const {
    initializeBranches,
    getBranches,
    createBranch,
    updateBranch,
    deactivateBranch,
    getPublicBranches
} = require('../controllers/branches.controller');
const { verifyToken, requireSuperAdmin } = require('../middlewares/auth.middleware');

// Ruta pública (no requiere autenticación)
router.get('/public', getPublicBranches);

// Todas las rutas siguientes requieren token válido
router.use(verifyToken);
// Todas las rutas de sucursales son exclusivas para super admins
router.use(requireSuperAdmin);

// Inicialización única de la feature — solo superAdmin
router.post('/initialize', initializeBranches);

// CRUD
router.get('/', getBranches);
router.post('/', createBranch);
router.patch('/:id', updateBranch);
router.delete('/:id', deactivateBranch);

module.exports = router;
