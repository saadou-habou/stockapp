const router = require('express').Router();
const { body } = require('express-validator');
const { getAll, getById, create, update, remove, getCategories } = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('sku').trim().notEmpty().withMessage('SKU requis'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
];

// Public → authentifié (client + admin)
router.get('/', authenticate, getAll);
router.get('/categories', authenticate, getCategories);
router.get('/:id', authenticate, getById);

// Admin uniquement
router.post('/', authenticate, requireAdmin, productValidation, create);
router.put('/:id', authenticate, requireAdmin, [
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
], update);
router.delete('/:id', authenticate, requireAdmin, remove);

module.exports = router;
