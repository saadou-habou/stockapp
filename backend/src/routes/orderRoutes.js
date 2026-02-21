const router = require('express').Router();
const { body } = require('express-validator');
const { createOrder, getMyOrders, getAllOrders, approveOrder, rejectOrder, getOrderStats } = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Client
router.get('/my', authenticate, getMyOrders);
router.post('/', authenticate, [
  body('product_id').isUUID().withMessage('product_id invalide'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité doit être >= 1'),
  body('client_note').optional().isLength({ max: 500 }),
], createOrder);

// Admin
router.get('/stats', authenticate, requireAdmin, getOrderStats);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.put('/:id/approve', authenticate, requireAdmin, [
  body('admin_note').optional().isLength({ max: 500 }),
], approveOrder);
router.put('/:id/reject', authenticate, requireAdmin, [
  body('admin_note').optional().isLength({ max: 500 }),
], rejectOrder);

module.exports = router;
