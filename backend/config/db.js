const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el pool de conexiones usando las variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Establecer la conexion
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.message);
    });

module.exports = pool;