const router = require('express').Router();
const { body } = require('express-validator');
const { getAll, create } = require('../controllers/supplierController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, getAll);
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Nom du fournisseur requis'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('phone').optional().isLength({ max: 50 }),
], create);

module.exports = router;
