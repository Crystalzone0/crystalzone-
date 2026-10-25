import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderLimiter, trackingLimiter } from '../middleware/rateLimiters.js';
import {
  placeOrderSchema,
  trackOrderSchema,
  cancelOrderSchema,
  orderListQuerySchema,
} from '../validators/orderValidators.js';
import {
  placeOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
  trackOrder,
} from '../controllers/orderController.js';

const router = Router();

// Checkout works for guests and customers (optionalAuth attaches the user when logged in).
router.post('/', orderLimiter, optionalAuth, validate(placeOrderSchema), placeOrder);

// Public tracking: Order ID + phone or email.
router.post('/track', trackingLimiter, validate(trackOrderSchema), trackOrder);

// Customer's own orders.
router.get('/', protect, validate(orderListQuerySchema, 'query'), getMyOrders);
router.get('/:id', protect, getMyOrder);
router.post('/:id/cancel', protect, validate(cancelOrderSchema), cancelMyOrder);

export default router;