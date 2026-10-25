import { Order, OrderItem, PAYMENT_STATUSES } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { startOfDay, endOfDay } from '../utils/dates.js';
import { buildPagination } from '../utils/pagination.js';
import { changeOrderStatus } from '../services/orderService.js';

/** Full order for the admin: customer account, address, products, quantities, totals, history. */
async function loadAdminOrder(id) {
  const order = await Order.findById(id)
    .populate('user', 'name email phone isActive')
    .populate('statusHistory.changedBy', 'name');
  if (!order) throw new AppError('Order not found', 404);

  const items = await OrderItem.find({ order: order._id }).sort({ createdAt: 1, _id: 1 });
  return { order: { ...order.toJSON(), items: items.map((item) => item.toJSON()) } };
}

/** GET /api/admin/orders: search + filters + pagination, with counts per status for the tabs. */
export const listOrders = asyncHandler(async (req, res) => {
  const { search, status, paymentStatus, from, to, page, limit } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) filter.paymentStatus = paymentStatus;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = startOfDay(from);
    if (to) filter.createdAt.$lte = endOfDay(to);
  }

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { orderId: rx },
      { 'customer.name': rx },
      { 'customer.phone': rx },
      { 'customer.email': rx },
      { 'shippingAddress.city': rx },
    ];
  }

  const [orders, total, statusRows] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-statusHistory'),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    orders,
    pagination: buildPagination(page, limit, total),
    statusCounts: Object.fromEntries(statusRows.map((r) => [r._id, r.count])),
  });
});

/** GET /api/admin/orders/:id */
export const getOrder = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await loadAdminOrder(req.params.id)) });
});

async function applyStatus(req, res, status, fallbackNote) {
  const note = req.body.note || fallbackNote;

  await changeOrderStatus(req.params.id, status, {
    note,
    changedBy: req.user._id,
    cancelReason: status === 'Cancelled' ? note : '',
  });

  res.json({
    success: true,
    message: `Order marked as ${status}`,
    ...(await loadAdminOrder(req.params.id)),
  });
}

/** PUT /api/admin/orders/:id  { status, note? } */
export const updateOrderStatus = asyncHandler((req, res) =>
  applyStatus(req, res, req.body.status, 'Status updated by store')
);

/** POST /api/admin/orders/:id/cancel: restores stock (once). */
export const cancelOrder = asyncHandler((req, res) => applyStatus(req, res, 'Cancelled', 'Cancelled by store'));

/** POST /api/admin/orders/:id/ship */
export const markShipped = asyncHandler((req, res) => applyStatus(req, res, 'Shipped', 'Handed to courier'));

/** POST /api/admin/orders/:id/deliver: also marks the Cash on Delivery payment as paid. */
export const markDelivered = asyncHandler((req, res) => applyStatus(req, res, 'Delivered', 'Delivered to customer'));