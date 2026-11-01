const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas de contactos usan el middleware JWT
router.use(verifyToken);

// 1. OBTENER todos los contactos del usuario autenticado (READ)
router.get('/', async (req, res) => {
    try {
        const [contacts] = await db.query(
            'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener contactos', error: error.message });
    }
});

// 2. CREAR un nuevo contacto (CREATE)
router.post('/', async (req, res) => {
    const { name, email, phone, category, status } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO contacts (user_id, name, email, phone, category, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, name, email, phone, category || 'Personal', status || 'Activo']
        );
        res.status(201).json({ id: result.insertId, name, email, phone, category, status });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear contacto', error: error.message });
    }
});

// 3. ACTUALIZAR un contacto existente (UPDATE)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, category, status, is_favorite } = req.body;
    try {
        const [result] = await db.query(
            `UPDATE contacts 
             SET name = ?, email = ?, phone = ?, category = ?, status = ?, is_favorite = ? 
             WHERE id = ? AND user_id = ?`,
            [name, email, phone, category, status, is_favorite ? 1 : 0, id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contacto no encontrado o no autorizado' });
        }

        res.json({ message: 'Contacto actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar contacto', error: error.message });
    }
});

// 4. ELIMINAR un contacto (DELETE)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'DELETE FROM contacts WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contacto no encontrado o no autorizado' });
        }

        res.json({ message: 'Contacto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar contacto', error: error.message });
    }
});

module.exports = router;