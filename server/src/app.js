const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ruta de prueba inicial
app.get('/', (req, res) => {
    res.send('Servidor de Fluxer (Refactored) funcionando correctamente! 🚀');
});

// Rutas de la API
const clientesRoutes = require('./routes/clientes.routes');
const profesionalesRoutes = require('./routes/profesionales.routes');
const planesRoutes = require('./routes/planes.routes');
const turnosRoutes = require('./routes/turnos.routes');
const configuracionRoutes = require('./routes/configuracion.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const feriadosRoutes = require('./routes/feriados.routes');
const calendarioRoutes = require('./routes/calendario.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authRoutes = require('./routes/auth.routes');
const { verifyToken, requirePermiso } = require('./middlewares/auth.middleware');

app.use('/api/auth', authRoutes);
app.use('/api/clientes', verifyToken, requirePermiso('permisoClientes'), clientesRoutes);
app.use('/api/profesionales', verifyToken, profesionalesRoutes);
app.use('/api/planes', verifyToken, requirePermiso('permisoPlanes'), planesRoutes);
app.use('/api/turnos', verifyToken, requirePermiso('permisoTurnos'), turnosRoutes);
app.use('/api/configuracion', verifyToken, configuracionRoutes);
app.use('/api/categorias', verifyToken, categoriasRoutes);
app.use('/api/feriados', verifyToken, requirePermiso('permisoFeriados'), feriadosRoutes);
app.use('/api/calendario', verifyToken, calendarioRoutes);
app.use('/api/dashboard', verifyToken, requirePermiso('permisoFinanzas'), dashboardRoutes);

module.exports = app;
