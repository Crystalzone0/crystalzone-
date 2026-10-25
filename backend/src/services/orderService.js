import { Order, OrderItem, Cart } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { generateOrderId } from '../utils/generateOrderId.js';
import { normalizePhone } from '../utils/phone.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';
import { isObjectId } from '../middleware/validateObjectId.js';
import { findVisibleProducts } from './catalogVisibility.js';
import { calculateTotals } from './pricingService.js';
import { getSettings } from './settingsService.js';
import { MAX_LINE_QUANTITY } from './cartService.js';
import { reserveStock, restoreStock } from './stockService.js';
import { getPaymentProvider } from './payments/index.js';
import { sendOrderEmails } from './emailService.js';

const FINAL_STATUSES = ['Delivered', 'Cancelled'];
const CUSTOMER_CANCELLABLE = ['Order Placed', 'Confirmed'];

// ------------------------------------------------------------------ serialization

const serializeItem = (item) => ({
  id: item.id,
  productId: String(item.product),
  name: item.name,
  slug: item.slug,
  sku: item.sku,
  image: item.image,
  unitPrice: item.unitPrice,
  paidPrice: item.paidPrice,
  quantity: item.quantity,
  lineTotal: item.lineTotal,
});

/** Full order as the customer who owns it sees it. */
export function serializeOrder(order, items) {
  const data = order.toJSON();
  delete data.user;
    delete data.stockRestored;
  delete data.idempotencyKey;
  data.statusHistory = (data.statusHistory || []).map(({ status, at, note }) => ({ status, at, note }));
  data.items = items.map(serializeItem);
  return data;
}

/** Limited view for order tracking: no full street address, no internal ids. */
export function serializeTracking(order, items) {
  return {
    orderId: order.orderId,
    status: order.status,
    statusHistory: order.statusHistory.map(({ status, at, note }) => ({ status, at, note })),
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt || null,
    cancelledAt: order.cancelledAt || null,
    cancelReason: order.cancelReason || '',
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customerName: order.customer.name,
    city: order.shippingAddress.city,
    province: order.shippingAddress.province,
    itemCount: order.itemCount,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    items: items.map(({ name, slug, image, quantity, paidPrice, lineTotal }) => ({
      name,
      slug,
      image,
      quantity,
      paidPrice,
      lineTotal,
    })),
  };
}

/** wa.me link with a ready-to-send message about this order (order confirmation page, tracking page). */
export function orderWhatsAppLink(order, settings) {
  const message =
    `Hello Crystal Zone! I placed order ${order.orderId} ` +
    `(${settings.currency} ${Number(order.total).toLocaleString('en-PK')}). ` +
    `Name: ${order.customer.name}. Please confirm my order. Thank you!`;
  return buildWhatsAppLink(message, settings.whatsappNumber);
}

// ------------------------------------------------------------------ lookups

const ORDER_REF = /^[A-Za-z0-9-]{6,30}$/;

/** Finds an order by MongoDB id or by its public Order ID (CZ-...). */
async function findOrderByRef(ref, extraFilter = {}) {
  const value = String(ref || '');
  if (!isObjectId(value) && !ORDER_REF.test(value)) return null;

  const filter = isObjectId(value) ? { _id: value } : { orderId: value.toUpperCase() };
  return Order.findOne({ ...filter, ...extraFilter });
}

async function loadItems(orderIds) {
  const items = await OrderItem.find({ order: { $in: orderIds } }).sort({ createdAt: 1, _id: 1 });
  const byOrder = new Map();
  for (const item of items) {
    const key = String(item.order);
    if (!byOrder.has(key)) byOrder.set(key, []);
    byOrder.get(key).push(item);
  }
  return byOrder;
}

// ------------------------------------------------------------------ placing an order

/**
 * Turns the request (or the saved cart) into verified order lines.
 * Every price and stock figure comes from the database, never from the client.
 */
async function resolveOrderLines(rawItems, user) {
  let requested;

  if (rawItems && rawItems.length > 0) {
    requested = rawItems;
  } else {
    if (!user) throw new AppError('Your cart is empty', 400);
    const cart = await Cart.findOne({ user: user._id });
    requested = (cart?.items || []).map((i) => ({ productId: String(i.product), quantity: i.quantity }));
    if (requested.length === 0) throw new AppError('Your cart is empty', 400);
  }

  // Merge duplicate products.
  const wanted = new Map();
  for (const { productId, quantity } of requested) {
    const id = String(productId);
    wanted.set(id, (wanted.get(id) || 0) + quantity);
  }

  const products = await findVisibleProducts([...wanted.keys()]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const problems = [];
  const lines = [];

  for (const [id, quantity] of wanted) {
    const product = byId.get(id);

    if (!product) {
      problems.push({ productId: id, message: 'An item in your order is no longer available' });
    } else if (quantity > MAX_LINE_QUANTITY) {
      problems.push({
        productId: id,
        message: `You can order at most ${MAX_LINE_QUANTITY} of "${product.name}"`,
      });
    } else if (product.stock <= 0) {
      problems.push({ productId: id, message: `"${product.name}" is out of stock` });
    } else if (quantity > product.stock) {
      problems.push({
        productId: id,
        message: `Only ${product.stock} of "${product.name}" left in stock`,
      });
    } else {
      lines.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        image: product.primaryImage,
        price: product.price, // regular price
        salePrice: product.salePrice ?? null,
        finalPrice: product.effectivePrice, // price the customer pays per unit
        quantity,
      });
    }
  }

  if (problems.length > 0) {
    const message =
      problems.length === 1
        ? problems[0].message
        : 'Some items in your order are no longer available in the quantity you chose. Please review your cart.';
    throw new AppError(message, 409, problems);
  }

  return lines;
}

/** Order.create with a fresh Order ID; retries on the (very unlikely) ID collision. */
async function createOrderDocument(data) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await Order.create({ ...data, orderId: generateOrderId() });
    } catch (err) {
      const idCollision = err.code === 11000 && err.keyPattern && err.keyPattern.orderId;
      if (!idCollision || attempt >= 4) throw err;
    }
  }
}

/**
 * Places an order. Order of operations (spec steps 1-11):
 *   validate (route) -> re-check products, prices, stock -> calculate totals on the server ->
 *   reduce stock atomically -> create order + order items -> clear cart -> return confirmation.
 */
/** An order that already exists for this idempotency key: returned instead of creating a second one. */
async function replayOrder(order, input, settings) {
  // The key is random and known only to the browser that created it, but the email must match as well.
  if (order.customer.email !== input.email) {
    throw new AppError('This checkout was already used. Please refresh the page and try again.', 409);
  }

  const items = await OrderItem.find({ order: order._id }).sort({ createdAt: 1, _id: 1 });
  return {
    order: serializeOrder(order, items),
    whatsappLink: orderWhatsAppLink(order, settings),
    replayed: true,
  };
}

/**
 * Places an order. Order of operations (spec steps 1-11):
 *   validate (route) -> re-check products, prices, stock -> calculate totals on the server ->
 *   reduce stock atomically -> create order + order items -> clear cart -> return confirmation.
 *
 * idempotencyKey (optional): when the same key arrives again (for example the customer pressed the button again
 * after a dropped connection) the order created the first time is returned and nothing is created or charged twice.
 */
export async function placeOrder(input, user, idempotencyKey) {
  const settings = await getSettings();

  // This comes first: the first request already used the stock, so a replay must not be re-validated against it.
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) return replayOrder(existing, input, settings);
  }

  const provider = getPaymentProvider(input.paymentMethod);

  const lines = await resolveOrderLines(input.items, user);
  const totals = calculateTotals(lines, settings);

  // From here on, anything that fails must give the stock back.
  await reserveStock(lines);

  let order = null;
  let items = [];

  try {
    order = await createOrderDocument({
      user: user ? user._id : null,
      customer: { name: input.fullName, phone: input.phone, email: input.email },
      shippingAddress: {
        fullName: input.fullName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode || '',
      },
      notes: input.notes || '',
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',
      idempotencyKey,
    });

    items = await OrderItem.insertMany(
      lines.map((line) => ({
        order: order._id,
        product: line.productId,
        name: line.name,
        slug: line.slug,
        sku: line.sku,
        image: line.image,
        unitPrice: line.price,
        paidPrice: line.finalPrice,
        quantity: line.quantity,
        lineTotal: line.finalPrice * line.quantity,
      }))
    );

    const payment = await provider.createPayment(order);
    if (payment.paymentStatus !== order.paymentStatus || payment.paymentReference) {
      order.paymentStatus = payment.paymentStatus;
      order.paymentReference = payment.paymentReference || '';
      await order.save();
    }
  } catch (err) {
    if (order) {
      await OrderItem.deleteMany({ order: order._id }).catch(() => {});
      await Order.deleteOne({ _id: order._id }).catch(() => {});
    }
    await restoreStock(lines);

    // Two identical requests raced and the other one won: our stock is back, so return its order.
    if (err.code === 11000 && err.keyPattern && err.keyPattern.idempotencyKey) {
      const winner = await Order.findOne({ idempotencyKey });
      if (winner) return replayOrder(winner, input, settings);
    }
    throw err;
  }

  // The order is safely saved. Everything below is best effort and cannot undo it.
  if (user) {
    try {
      if (input.items && input.items.length > 0) {
        await Cart.updateOne(
          { user: user._id },
          { $pull: { items: { product: { $in: lines.map((l) => l.productId) } } } }
        );
      } else {
        await Cart.updateOne({ user: user._id }, { $set: { items: [] } });
      }
    } catch (err) {
      console.error('Could not clear cart after order:', err.message);
    }
  }

  sendOrderEmails(order, items, settings).catch(() => {});

  return { order: serializeOrder(order, items), whatsappLink: orderWhatsAppLink(order, settings) };
}
// ------------------------------------------------------------------ status changes (used by customers and, in Phase 7, admins)

/**
 * Gives back the stock of a cancelled order, exactly once.
 * The atomic stockRestored flag means a double-click or a retry can never restore twice.
 */
async function restoreOrderStock(order) {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, stockRestored: false },
    { $set: { stockRestored: true } }
  );
  if (!claimed) return;

  const items = await OrderItem.find({ order: order._id });
  const failed = await restoreStock(items.map((i) => ({ productId: i.product, quantity: i.quantity })));
  if (failed.length > 0) {
    console.error(`CRITICAL: order ${order.orderId} cancelled but stock was not restored for ${failed.length} product(s)`);
  }
}

/**
 * The only place an order's status changes.
 *  - Delivered and Cancelled are final.
 *  - Cancelled restores stock (once).
 *  - Delivered sets deliveredAt and marks the payment paid (cash collected on delivery).
 *  - onlyFrom (optional) limits which current statuses may move to the new one.
 * The check and the update happen in one atomic operation, so two simultaneous changes cannot both apply.
 */
export async function changeOrderStatus(
  orderMongoId,
  status,
  { note = '', changedBy = null, cancelReason = '', onlyFrom = null } = {}
) {
  const statusFilter = { $nin: [...FINAL_STATUSES, status] };
  if (onlyFrom) statusFilter.$in = onlyFrom;

  const set = { status };
  if (status === 'Cancelled') {
    set.cancelledAt = new Date();
    set.cancelReason = cancelReason;
  }
  if (status === 'Delivered') {
    set.deliveredAt = new Date();
    set.paymentStatus = 'paid';
  }

  const updated = await Order.findOneAndUpdate(
    { _id: orderMongoId, status: statusFilter },
    { $set: set, $push: { statusHistory: { status, note, changedBy, at: new Date() } } },
    { new: true }
  );

  if (!updated) {
    const existing = await Order.findById(orderMongoId).select('status');
    if (!existing) throw new AppError('Order not found', 404);
    if (existing.status === status) throw new AppError(`This order is already "${status}"`, 400);
    if (FINAL_STATUSES.includes(existing.status)) {
      throw new AppError(`This order is already ${existing.status.toLowerCase()} and can no longer be changed`, 400);
    }
    throw new AppError('This order can no longer be changed at its current stage', 400);
  }

  if (status === 'Cancelled') await restoreOrderStock(updated);
  return updated;
}

// ------------------------------------------------------------------ customer order views

/** GET /api/orders: the logged-in customer's own orders, newest first. */
export async function listUserOrders(userId, { page = 1, limit = 10 } = {}) {
  const filter = { user: userId };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const itemsByOrder = await loadItems(orders.map((o) => o._id));

  return {
    orders: orders.map((o) => serializeOrder(o, itemsByOrder.get(String(o._id)) || [])),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), hasMore: page * limit < total },
  };
}

/** GET /api/orders/:id (MongoDB id or Order ID). Only the owner can see it. */
export async function getUserOrder(userId, ref) {
  const order = await findOrderByRef(ref, { user: userId });
  if (!order) throw new AppError('Order not found', 404);

  const [items, settings] = await Promise.all([
    OrderItem.find({ order: order._id }).sort({ createdAt: 1, _id: 1 }),
    getSettings(),
  ]);

  return { order: serializeOrder(order, items), whatsappLink: orderWhatsAppLink(order, settings) };
}

/** POST /api/orders/:id/cancel: a customer may cancel their own order until it is Processing. */
export async function cancelOwnOrder(user, ref, reason) {
  const order = await findOrderByRef(ref, { user: user._id });
  if (!order) throw new AppError('Order not found', 404);

  if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
    throw new AppError(
      order.status === 'Cancelled'
        ? 'This order is already cancelled'
        : 'This order can no longer be cancelled online. Please contact us on WhatsApp.',
      400
    );
  }

  await changeOrderStatus(order._id, 'Cancelled', {
    note: 'Cancelled by customer',
    changedBy: user._id,
    cancelReason: reason || 'Cancelled by customer',
    onlyFrom: CUSTOMER_CANCELLABLE,
  });

  return getUserOrder(user._id, String(order._id));
}

// ------------------------------------------------------------------ public order tracking

function contactMatches(order, contact) {
  if (contact.includes('@')) {
    return order.customer.email === contact.trim().toLowerCase();
  }
  const given = normalizePhone(contact);
  if (given.length < 7) return false;
  return [order.customer.phone, order.shippingAddress.phone].some((p) => normalizePhone(p) === given);
}

/** POST /api/orders/track: needs the Order ID AND the phone number or email used at checkout. */
export async function trackOrder({ orderId, contact }) {
  const order = await Order.findOne({ orderId });

  // One generic message for "no such order" and "wrong phone/email".
  if (!order || !contactMatches(order, contact)) {
    throw new AppError(
      'We could not find an order with those details. Please check your Order ID and the phone number or email you used.',
      404
    );
  }

  const [items, settings] = await Promise.all([
    OrderItem.find({ order: order._id }).sort({ createdAt: 1, _id: 1 }),
    getSettings(),
  ]);

  return { order: serializeTracking(order, items), whatsappLink: orderWhatsAppLink(order, settings) };
}