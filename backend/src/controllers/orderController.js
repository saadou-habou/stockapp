const { validationResult } = require('express-validator');
const db = require('../config/db');

// ============================================================
// CLIENT
// ============================================================

// POST /api/orders — Client crée une demande
const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { product_id, quantity, client_note } = req.body;

  try {
    const product = await db.query(
      'SELECT id, name, price, quantity as stock FROM products WHERE id = $1 AND is_active = TRUE',
      [product_id]
    );
    if (!product.rows[0]) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    const p = product.rows[0];
    if (p.stock < parseInt(quantity)) {
      return res.status(400).json({
        error: `Stock insuffisant. Disponible : ${p.stock} unité(s), demandé : ${quantity}`
      });
    }

    const unit_price = parseFloat(p.price);
    const total_price = unit_price * parseInt(quantity);

    const result = await db.query(
      `INSERT INTO orders (client_id, product_id, quantity, unit_price, total_price, client_note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, product_id, quantity, unit_price, total_price, client_note || null]
    );

    res.status(201).json({
      message: `Demande d'achat envoyée pour "${p.name}". En attente de validation.`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur createOrder:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/orders/my — Client consulte ses propres commandes
const getMyOrders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, p.name as product_name, p.sku,
              u.first_name || ' ' || u.last_name as reviewed_by_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       LEFT JOIN users u ON o.reviewed_by = u.id
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erreur getMyOrders:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// ADMIN
// ============================================================

// GET /api/orders — Admin voit toutes les demandes
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM orders o ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT o.*,
              p.name as product_name, p.sku,
              c.first_name || ' ' || c.last_name as client_name,
              c.email as client_email,
              u.first_name || ' ' || u.last_name as reviewed_by_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users c ON o.client_id = c.id
       LEFT JOIN users u ON o.reviewed_by = u.id
       ${where}
       ORDER BY
         CASE o.status WHEN 'pending' THEN 0 ELSE 1 END,
         o.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Erreur getAllOrders:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/orders/:id/approve — Admin approuve → déclenche sortie de stock
const approveOrder = async (req, res) => {
  const { admin_note } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      `SELECT o.*, p.name as product_name, p.quantity as stock
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE o.id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (!order.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    const o = order.rows[0];

    if (o.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cette demande est déjà "${o.status}"` });
    }

    if (o.stock < o.quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Stock insuffisant pour valider. Disponible : ${o.stock}, demandé : ${o.quantity}`
      });
    }

    // Mettre à jour le statut de la commande
    await client.query(
      `UPDATE orders SET status='approved', admin_note=$1, reviewed_by=$2, reviewed_at=CURRENT_TIMESTAMP
       WHERE id=$3`,
      [admin_note || null, req.user.id, o.id]
    );

    // Créer la sortie de stock
    const qty_before = o.stock;
    const qty_after = qty_before - o.quantity;

    await client.query(
      `INSERT INTO stock_exits (product_id, quantity, reason, client_name, quantity_before, quantity_after, created_by)
       SELECT o.product_id, o.quantity, 'Commande client validée',
              u.first_name || ' ' || u.last_name,
              $1, $2, $3
       FROM orders o JOIN users u ON o.client_id = u.id
       WHERE o.id = $4`,
      [qty_before, qty_after, req.user.id, o.id]
    );

    await client.query('COMMIT');

    res.json({
      message: `Commande approuvée. Stock de "${o.product_name}" : ${qty_before} → ${qty_after}`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur approveOrder:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// PUT /api/orders/:id/reject — Admin refuse
const rejectOrder = async (req, res) => {
  const { admin_note } = req.body;
  try {
    const result = await db.query(
      `UPDATE orders SET status='rejected', admin_note=$1, reviewed_by=$2, reviewed_at=CURRENT_TIMESTAMP
       WHERE id=$3 AND status='pending' RETURNING *`,
      [admin_note || null, req.user.id, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Demande introuvable ou déjà traitée' });
    }

    res.json({ message: 'Demande refusée', data: result.rows[0] });
  } catch (error) {
    console.error('Erreur rejectOrder:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/orders/stats — Admin : compteurs par statut
const getOrderStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );
    const stats = { pending: 0, approved: 0, rejected: 0 };
    result.rows.forEach(r => { stats[r.status] = parseInt(r.count); });
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, approveOrder, rejectOrder, getOrderStats };
