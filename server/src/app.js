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

app.use('/api/clientes', clientesRoutes);
app.use('/api/profesionales', profesionalesRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/feriados', feriadosRoutes);

module.exports = app;
