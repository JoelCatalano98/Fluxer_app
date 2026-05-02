const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/database');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A MONGO ---
conectarDB();
// ------------------------

app.get('/', (req, res) => {
    res.send('Servidor de Fluxer funcionando correctamente! 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});