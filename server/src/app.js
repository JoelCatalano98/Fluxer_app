const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta de prueba inicial
app.get('/', (req, res) => {
    res.send('Servidor de Fluxer (Refactored) funcionando correctamente! 🚀');
});

// Rutas de la API
const clientesRoutes = require('./routes/clientes.routes');
const profesionalesRoutes = require('./routes/profesionales.routes');
const planesRoutes = require('./routes/planes.routes');

app.use('/api/clientes', clientesRoutes);
app.use('/api/profesionales', profesionalesRoutes);
app.use('/api/planes', planesRoutes);

module.exports = app;
