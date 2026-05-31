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

// Aquí se importarán e inyectarán las rutas más adelante
// const userRoutes = require('./routes/userRoutes');
// app.use('/api/users', userRoutes);

module.exports = app;
