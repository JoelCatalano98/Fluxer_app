const mongoose = require('mongoose');

const socioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    dni: { type: String, required: true, unique: true },
    edad: { type: Number, required: true },
    cuotaAlDia: { type: Boolean, default: true },
    fechaIngreso: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Socio', socioSchema, 'socios');