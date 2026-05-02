const conectarDB = require('./config/database');
const mongoose = require('mongoose');
const Socio = require('./models/Socio');

async function ejecutarTest() {
    try {
        console.log("⏳ Conectando a la DB...");
        
        await conectarDB(); // 🔥 conexión real

        const nuevoSocio = new Socio({
            nombre: "Tomás",
            apellido: "Catalano",
            dni: "45123789",
            edad: 20,
            cuotaAlDia: true
        });

        const resultado = await nuevoSocio.save();

        console.log("🚀 ¡Socio guardado con éxito!");
        console.log(resultado);

    } catch (error) {
        console.error("❌ Falló la operación:");
        console.error(error.message);
    } finally {
        await mongoose.connection.close();
    }
}

ejecutarTest();