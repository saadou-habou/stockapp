require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

async function seed() {
  console.log('Début du seeding...');
  const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

  try {
    // Admin
    const adminHash = await bcrypt.hash('Admin@1234', ROUNDS);
    const adminRole = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);

    await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role_id)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING
    `, ['admin@stockapp.com', adminHash, 'Super', 'Admin', adminRole.rows[0].id]);

    // Client test
    const clientHash = await bcrypt.hash('Client@1234', ROUNDS);
    const clientRole = await db.query('SELECT id FROM roles WHERE name = $1', ['client']);

    await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role_id)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING
    `, ['moussaaliyahaya@gmail.com', clientHash, 'Moussa', 'Ali Yahaya', clientRole.rows[0].id]);

    // Produits
    const adminResult = await db.query('SELECT id FROM users WHERE email = $1', ['admin@stockapp.com']);
    const adminId = adminResult.rows[0].id;

    const products = [
      ['Ordinateur portable', 'HP EliteBook 840 G9, 16GB RAM, 512GB SSD', 'ELITEBOOK-840', 1299.99, 25, 5, 'Informatique'],
      ['Souris sans fil', 'Logitech MX Master 3, ergonomique', 'MX-MASTER-3', 89.99, 150, 20, 'Périphériques'],
      ['Clavier mécanique', 'Keychron K2 Pro, sans fil', 'K2-PRO-BT', 119.99, 80, 15, 'Périphériques'],
      ['Écran 27"', 'Dell UltraSharp U2723D, 4K IPS', 'U2723D-DELL', 599.99, 30, 5, 'Moniteurs'],
      ['Câble USB-C', 'Câble USB-C 3.1 Gen2 2m', 'USBC-3A-2M', 19.99, 500, 50, 'Accessoires'],
    ];

    for (const [name, desc, sku, price, qty, min_qty, cat] of products) {
      const result = await db.query(`
        INSERT INTO products (name, description, sku, price, quantity, min_quantity, category, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (sku) DO NOTHING RETURNING id`,
        [name, desc, sku, price, qty, min_qty, cat, adminId]
      );

      if (result.rows[0]) {
        await db.query(`
          INSERT INTO stock_entries (product_id, quantity, reason, quantity_before, quantity_after, created_by)
          VALUES ($1, $2, 'Stock initial', 0, $2, $3)`,
          [result.rows[0].id, qty, adminId]
        );
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Erreur seeding:', err);
    process.exit(1);
  }
}

seed();
