const { validationResult } = require('express-validator');
const db = require('../config/db');

// ============================================================
// ENTRÉES DE STOCK
// ============================================================

// GET /api/stock/entries
const getEntries = async (req, res) => {
  try {
    const { page = 1, limit = 20, product_id, from, to } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (product_id) { conditions.push(`se.product_id = $${idx++}`); params.push(product_id); }
    if (from) { conditions.push(`se.created_at >= $${idx++}`); params.push(from); }
    if (to) { conditions.push(`se.created_at <= $${idx++}`); params.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM stock_entries se ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT se.*, p.name as product_name, p.sku,
              u.first_name || ' ' || u.last_name as created_by_name
       FROM stock_entries se
       JOIN products p ON se.product_id = p.id
       LEFT JOIN users u ON se.created_by = u.id
       ${where}
       ORDER BY se.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Erreur getEntries:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/stock/entries (admin uniquement)
const createEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { product_id, quantity, unit_price, reason = 'Approvisionnement', supplier, reference_doc } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const product = await client.query(
      'SELECT id, name, quantity FROM products WHERE id = $1 AND is_active = TRUE FOR UPDATE',
      [product_id]
    );
    if (!product.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const qty_before = product.rows[0].quantity;
    const qty_after = qty_before + parseInt(quantity);

    const entry = await client.query(
      `INSERT INTO stock_entries (product_id, quantity, unit_price, reason, supplier, reference_doc, quantity_before, quantity_after, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [product_id, quantity, unit_price, reason, supplier, reference_doc, qty_before, qty_after, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: `Entrée de ${quantity} unités enregistrée. Stock: ${qty_before} → ${qty_after}`,
      data: { ...entry.rows[0], product_name: product.rows[0].name }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur createEntry:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// ============================================================
// SORTIES DE STOCK
// ============================================================

// GET /api/stock/exits
const getExits = async (req, res) => {
  try {
    const { page = 1, limit = 20, product_id, from, to } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (product_id) { conditions.push(`se.product_id = $${idx++}`); params.push(product_id); }
    if (from) { conditions.push(`se.created_at >= $${idx++}`); params.push(from); }
    if (to) { conditions.push(`se.created_at <= $${idx++}`); params.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM stock_exits se ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT se.*, p.name as product_name, p.sku,
              u.first_name || ' ' || u.last_name as created_by_name
       FROM stock_exits se
       JOIN products p ON se.product_id = p.id
       LEFT JOIN users u ON se.created_by = u.id
       ${where}
       ORDER BY se.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Erreur getExits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/stock/exits (admin uniquement)
const createExit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { product_id, quantity, reason = 'Vente', client_name, reference_doc } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const product = await client.query(
      'SELECT id, name, quantity FROM products WHERE id = $1 AND is_active = TRUE FOR UPDATE',
      [product_id]
    );
    if (!product.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const qty_before = product.rows[0].quantity;
    if (qty_before < parseInt(quantity)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Stock insuffisant. Disponible: ${qty_before}, Demandé: ${quantity}`
      });
    }

    const qty_after = qty_before - parseInt(quantity);

    const exit = await client.query(
      `INSERT INTO stock_exits (product_id, quantity, reason, client_name, reference_doc, quantity_before, quantity_after, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [product_id, quantity, reason, client_name, reference_doc, qty_before, qty_after, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: `Sortie de ${quantity} unités enregistrée. Stock: ${qty_before} → ${qty_after}`,
      data: { ...exit.rows[0], product_name: product.rows[0].name }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur createExit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// GET /api/stock/history/:product_id
const getProductHistory = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { limit = 50 } = req.query;

    const product = await db.query('SELECT name, sku, quantity FROM products WHERE id = $1', [product_id]);
    if (!product.rows[0]) return res.status(404).json({ error: 'Produit non trouvé' });

    const entries = await db.query(
      `SELECT 'entrée' as type, quantity, reason, quantity_before, quantity_after, created_at,
              u.first_name || ' ' || u.last_name as user_name
       FROM stock_entries se LEFT JOIN users u ON se.created_by = u.id
       WHERE product_id = $1`,
      [product_id]
    );

    const exits = await db.query(
      `SELECT 'sortie' as type, quantity, reason, quantity_before, quantity_after, created_at,
              u.first_name || ' ' || u.last_name as user_name
       FROM stock_exits se LEFT JOIN users u ON se.created_by = u.id
       WHERE product_id = $1`,
      [product_id]
    );

    const history = [...entries.rows, ...exits.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, parseInt(limit));

    res.json({ product: product.rows[0], history });
  } catch (error) {
    console.error('Erreur getProductHistory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/stock/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totals, lowStock, recentEntries, recentExits] = await Promise.all([
      db.query(`SELECT COUNT(*) as total_products, SUM(quantity) as total_units, 
                       SUM(price * quantity) as stock_value FROM products WHERE is_active=TRUE`),
      db.query(`SELECT id, name, sku, quantity, min_quantity FROM products 
                WHERE is_active=TRUE AND quantity <= min_quantity ORDER BY quantity ASC LIMIT 10`),
      db.query(`SELECT se.quantity, p.name as product_name, se.created_at, se.reason
                FROM stock_entries se JOIN products p ON se.product_id=p.id 
                ORDER BY se.created_at DESC LIMIT 5`),
      db.query(`SELECT se.quantity, p.name as product_name, se.created_at, se.reason
                FROM stock_exits se JOIN products p ON se.product_id=p.id 
                ORDER BY se.created_at DESC LIMIT 5`)
    ]);

    res.json({
      stats: totals.rows[0],
      low_stock_alerts: lowStock.rows,
      recent_entries: recentEntries.rows,
      recent_exits: recentExits.rows
    });
  } catch (error) {
    console.error('Erreur getDashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getEntries, createEntry, getExits, createExit, getProductHistory, getDashboard };
