import asyncHandler from '../utils/asyncHandler.js';
import {
  placeOrder as placeOrderService,
  listUserOrders,
  getUserOrder,
  cancelOwnOrder,
  trackOrder as trackOrderService,
} from '../services/orderService.js';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,64}$/;

/** POST /api/orders: guest or logged-in checkout (Cash on Delivery). */
export const placeOrder = asyncHandler(async (req, res) => {
  // Optional header from the browser: the same key means "this is a retry of the same checkout".
  const header = req.get('Idempotency-Key');
  const idempotencyKey = header && IDEMPOTENCY_KEY.test(header) ? header : undefined;

  const result = await placeOrderService(req.body, req.user || null, idempotencyKey);
  res.status(201).json({ success: true, message: 'Order placed successfully', ...result });
});

/** GET /api/orders */
export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await listUserOrders(req.user._id, req.query);
  res.json({ success: true, ...result });
});

/** GET /api/orders/:id */
export const getMyOrder = asyncHandler(async (req, res) => {
  const result = await getUserOrder(req.user._id, req.params.id);
  res.json({ success: true, ...result });
});

/** POST /api/orders/:id/cancel */
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const result = await cancelOwnOrder(req.user, req.params.id, req.body.reason);
  res.json({ success: true, message: 'Your order has been cancelled', ...result });
});

/** POST /api/orders/track  { orderId, contact } */
export const trackOrder = asyncHandler(async (req, res) => {
  const result = await trackOrderService(req.body);
  res.json({ success: true, ...result });
});