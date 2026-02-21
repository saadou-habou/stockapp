const { validationResult } = require('express-validator');
const db = require('../config/db');

// GET /api/suppliers
const getAll = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, contact, phone, email, address
       FROM suppliers
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erreur getAll suppliers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/suppliers (admin uniquement)
const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, contact, phone, email, address } = req.body;
  try {
    const existing = await db.query(
      'SELECT id FROM suppliers WHERE name ILIKE $1', [name]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Ce fournisseur existe déjà' });
    }

    const result = await db.query(
      `INSERT INTO suppliers (name, contact, phone, email, address, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, contact || null, phone || null, email || null, address || null, req.user.id]
    );
    res.status(201).json({ message: 'Fournisseur créé', data: result.rows[0] });
  } catch (error) {
    console.error('Erreur create supplier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, create };
