const router = require('express').Router();
const { body } = require('express-validator');
const { getEntries, createEntry, getExits, createExit, getProductHistory, getDashboard } = require('../controllers/stockController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const entryValidation = [
  body('product_id').isUUID().withMessage('product_id invalide'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité doit être >= 1'),
  body('unit_price').optional().isFloat({ min: 0 }),
];

const exitValidation = [
  body('product_id').isUUID().withMessage('product_id invalide'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité doit être >= 1'),
];

// Dashboard (admin)
router.get('/dashboard', authenticate, requireAdmin, getDashboard);

// Entrées
router.get('/entries', authenticate, requireAdmin, getEntries);
router.post('/entries', authenticate, requireAdmin, entryValidation, createEntry);

// Sorties
router.get('/exits', authenticate, requireAdmin, getExits);
router.post('/exits', authenticate, requireAdmin, exitValidation, createExit);

// Historique produit (admin)
router.get('/history/:product_id', authenticate, requireAdmin, getProductHistory);

module.exports = router;
