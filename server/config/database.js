const mongoose = require('mongoose');
require('dotenv').config();

// 🔥 FIX DNS (MUY IMPORTANTE para Atlas)
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const conectarDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("La variable MONGO_URI no está definida en el archivo .env");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            family: 4, // Fuerza IPv4
        });

        console.log("✅ Conexión establecida con MongoDB Atlas");
        console.log("Estado:", mongoose.connection.readyState);

    } catch (err) {
        console.error("❌ Error de conexión:", err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error("👉 Asegúrate de que tu IP esté habilitada en Network Access de MongoDB Atlas.");
        }
        process.exit(1);
    }
};

module.exports = conectarDB;