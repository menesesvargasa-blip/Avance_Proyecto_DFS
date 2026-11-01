require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Definición de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);

// Middleware para manejo centralizado de errores 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Ocurrió un error en el servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});