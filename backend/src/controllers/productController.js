const { validationResult } = require('express-validator');
const db = require('../config/db');

// GET /api/products
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, low_stock } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['p.is_active = TRUE'];
    let params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (category) {
      conditions.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (low_stock === 'true') {
      conditions.push(`p.quantity <= p.min_quantity`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT p.id, p.name, p.description, p.sku, p.price, p.quantity, 
              p.min_quantity, p.category, p.unit, p.is_active, p.created_at, p.updated_at
       FROM products p ${whereClause}
       ORDER BY p.name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Erreur getAll products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/products/:id
const getById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM stock_entries WHERE product_id = p.id) as total_entries,
        (SELECT COUNT(*) FROM stock_exits WHERE product_id = p.id) as total_exits
       FROM products p WHERE p.id = $1 AND p.is_active = TRUE`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erreur getById product:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/products (admin uniquement)
const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, sku, price, quantity = 0, min_quantity = 0, category, unit = 'unité' } = req.body;
  try {
    const existing = await db.query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Ce SKU est déjà utilisé' });
    }

    const result = await db.query(
      `INSERT INTO products (name, description, sku, price, quantity, min_quantity, category, unit, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, description, sku, price, quantity, min_quantity, category, unit, req.user.id]
    );

    // Si quantité initiale, créer une entrée
    if (quantity > 0) {
      await db.query(
        `INSERT INTO stock_entries (product_id, quantity, reason, quantity_before, quantity_after, created_by)
         VALUES ($1, $2, 'Stock initial', 0, $2, $3)`,
        [result.rows[0].id, quantity, req.user.id]
      );
    }

    res.status(201).json({ message: 'Produit créé', data: result.rows[0] });
  } catch (error) {
    console.error('Erreur create product:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/products/:id (admin uniquement)
const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, price, min_quantity, category, unit } = req.body;
  try {
    const result = await db.query(
      `UPDATE products SET name=$1, description=$2, price=$3, min_quantity=$4, category=$5, unit=$6
       WHERE id=$7 AND is_active=TRUE RETURNING *`,
      [name, description, price, min_quantity, category, unit, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ message: 'Produit mis à jour', data: result.rows[0] });
  } catch (error) {
    console.error('Erreur update product:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/products/:id (admin uniquement)
const remove = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE products SET is_active=FALSE WHERE id=$1 AND is_active=TRUE RETURNING id',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ message: 'Produit archivé avec succès' });
  } catch (error) {
    console.error('Erreur delete product:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT category FROM products WHERE is_active=TRUE AND category IS NOT NULL ORDER BY category'
    );
    res.json({ data: result.rows.map(r => r.category) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove, getCategories };
