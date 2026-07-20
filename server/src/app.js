const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors({ origin: '*' }));
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
const avisosRoutes = require('./routes/avisos.routes');
const calendarioRoutes = require('./routes/calendario.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authRoutes = require('./routes/auth.routes');
const authSocioRoutes = require('./routes/authSocio.routes');
const perfilSocioRoutes = require('./routes/perfilSocio.routes');
const turnoSocioRoutes = require('./routes/turnoSocio.routes');
const rutinaSocioRoutes = require('./routes/rutinaSocio.routes');
const avisosSocioRoutes = require('./routes/avisosSocio.routes');
const rutinasRoutes = require('./routes/rutinas.routes');
const actividadRoutes = require('./routes/actividad.routes');
const claseRoutes = require('./routes/clase.routes');
const rankingRoutes = require('./routes/ranking.routes');
const pagosRoutes = require('./routes/pagos.routes');
const { verifyToken, requirePermiso } = require('./middlewares/auth.middleware');

app.use('/api/auth', authRoutes);
app.use('/api/socio/auth', authSocioRoutes);
app.use('/api/socio/perfil', perfilSocioRoutes);
app.use('/api/socio/turnos', turnoSocioRoutes);
app.use('/api/socio/rutinas', rutinaSocioRoutes);
app.use('/api/socio/avisos', avisosSocioRoutes);
app.use('/api/clientes', verifyToken, requirePermiso('permisoClientes'), clientesRoutes);
app.use('/api/profesionales', verifyToken, profesionalesRoutes);
app.use('/api/planes', verifyToken, requirePermiso('permisoPlanes'), planesRoutes);
app.use('/api/turnos', verifyToken, requirePermiso('permisoTurnos'), turnosRoutes);
app.use('/api/configuracion', verifyToken, configuracionRoutes);
app.use('/api/categorias', verifyToken, categoriasRoutes);
app.use('/api/avisos', verifyToken, requirePermiso('permisoFeriados'), avisosRoutes);
app.use('/api/calendario', verifyToken, calendarioRoutes);
app.use('/api/dashboard', verifyToken, requirePermiso('permisoFinanzas'), dashboardRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/actividades', verifyToken, actividadRoutes);
app.use('/api/clases', verifyToken, claseRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/pagos', pagosRoutes);

module.exports = app;
