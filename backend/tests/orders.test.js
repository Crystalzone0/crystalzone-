import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Cart, Order, OrderItem, Product } from '../src/models/index.js';
import { adminAgent, api, clearDb, customerAgent, makeCategory, makeProduct, orderItem, orderPayload, placeOrder, startDb, stopDb } from './helpers.js';

let category;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  category = await makeCategory('Earrings');
});

const stockOf = async (product) => (await Product.findById(product._id)).stock;

describe('placing an order', () => {
  it('works out every number on the server, saves the order, and reduces the stock', async () => {
    const product = await makeProduct(category, { price: 1500, salePrice: 1200, stock: 10 });
    const res = await placeOrder(api(), [orderItem(product, 2)]);

    expect(res.status).toBe(201);
    const { order } = res.body;
    expect(order.orderId).toMatch(/^CZ-\d{6}-[A-HJ-NP-Z2-9]{6}$/);
    expect(order).toMatchObject({
      subtotal: 3000,
      discount: 600,
      shippingFee: 250,
      total: 2650,
      itemCount: 2,
      status: 'Order Placed',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
    });
    expect(order.items[0]).toMatchObject({ quantity: 2, unitPrice: 1500, paidPrice: 1200, lineTotal: 2400 });
    expect(order.statusHistory[0].status).toBe('Order Placed');
    expect(res.body.whatsappLink).toContain('https://wa.me/');

    const stored = await Product.findById(product._id);
    expect(stored.stock).toBe(8);
    expect(stored.soldCount).toBe(2);
    expect(await Order.countDocuments()).toBe(1);
    expect(await OrderItem.countDocuments()).toBe(1);
  });

  it('never trusts prices, totals or status sent by the browser', async () => {
    const product = await makeProduct(category, { price: 1500, salePrice: 1200, stock: 10 });
    const res = await api()
      .post('/api/orders')
      .send(
        orderPayload([{ productId: String(product._id), quantity: 1, price: 1, finalPrice: 1 }], {
          total: 1,
          subtotal: 1,
          discount: 99999,
          shippingFee: 0,
          status: 'Delivered',
          paymentStatus: 'paid',
        })
      );

    expect(res.status).toBe(201);
    expect(res.body.order).toMatchObject({ subtotal: 1500, discount: 300, shippingFee: 250, total: 1450, status: 'Order Placed', paymentStatus: 'pending' });
  });

  it('gives free delivery once the amount reaches the threshold', async () => {
    const product = await makeProduct(category, { price: 5000, stock: 3 });
    const res = await placeOrder(api(), [orderItem(product)]);
    expect(res.body.order).toMatchObject({ shippingFee: 0, total: 5000 });
  });

  it('refuses an out-of-stock product and changes nothing', async () => {
    const product = await makeProduct(category, { stock: 0 });
    const res = await placeOrder(api(), [orderItem(product)]);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('out of stock');
    expect(await Order.countDocuments()).toBe(0);
    expect(await stockOf(product)).toBe(0);
  });

  it('refuses more than the stock, and says how many are left', async () => {
    const product = await makeProduct(category, { stock: 2 });
    const res = await placeOrder(api(), [orderItem(product, 3)]);

    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toContain('Only 2');
    expect(await stockOf(product)).toBe(2);
  });

  it('refuses hidden products', async () => {
    const hidden = await makeProduct(category, { isActive: false });
    const res = await placeOrder(api(), [orderItem(hidden)]);
    expect(res.status).toBe(409);
    expect(await Order.countDocuments()).toBe(0);
  });

  it('is all-or-nothing when several products are ordered', async () => {
    const fine = await makeProduct(category, { stock: 5 });
    const soldOut = await makeProduct(category, { stock: 0 });
    const res = await placeOrder(api(), [orderItem(fine), orderItem(soldOut)]);

    expect(res.status).toBe(409);
    expect(await stockOf(fine)).toBe(5); // untouched
    expect(await Order.countDocuments()).toBe(0);
  });

  it('rejects missing or invalid details', async () => {
    const product = await makeProduct(category);
    const bad = await api()
      .post('/api/orders')
      .send(orderPayload([orderItem(product)], { address: '', phone: 'abc', email: 'nope' }));
    expect(bad.status).toBe(400);
    expect(bad.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['address', 'phone', 'email']));

    expect((await placeOrder(api(), [])).status).toBe(400);
    expect((await api().post('/api/orders').send({ ...orderPayload(undefined), items: undefined })).status).toBe(400);
    expect((await placeOrder(api(), [orderItem(product)], { paymentMethod: 'bitcoin' })).status).toBe(400);
    expect((await placeOrder(api(), [{ productId: String(product._id), quantity: 0 }])).status).toBe(400);
    expect(await Order.countDocuments()).toBe(0);
  });

  it('checks out a logged-in customer\'s saved cart and empties it', async () => {
    const { user, agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 10 });
    await agent.post('/api/cart').send({ productId: String(product._id), quantity: 2 });

    const res = await agent.post('/api/orders').send(orderPayload(undefined, { items: undefined }));
    expect(res.status).toBe(201);
    expect(res.body.order.itemCount).toBe(2);
    expect((await Order.findOne()).user.toString()).toBe(String(user._id));
    expect((await agent.get('/api/cart')).body.cart.items).toHaveLength(0);
    expect((await Cart.findOne({ user: user._id })).items).toHaveLength(0);
  });
});

describe('overselling', () => {
  it('with 1 unit left and 6 simultaneous orders, exactly one succeeds', async () => {
    const product = await makeProduct(category, { stock: 1 });
    const results = await Promise.all(Array.from({ length: 6 }, () => placeOrder(api(), [orderItem(product)])));

    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(5);
    expect(await stockOf(product)).toBe(0); // never negative
    expect(await Order.countDocuments()).toBe(1);
  });

  it('with 5 units and 8 simultaneous orders for 1 each, exactly 5 succeed', async () => {
    const product = await makeProduct(category, { stock: 5 });
    const results = await Promise.all(Array.from({ length: 8 }, () => placeOrder(api(), [orderItem(product)])));

    expect(results.filter((r) => r.status === 201)).toHaveLength(5);
    expect(await stockOf(product)).toBe(0);
    expect(await Order.countDocuments()).toBe(5);
  });
});

describe('safe retries (idempotency)', () => {
  const KEY = 'test-idempotency-key-0001';

  it('returns the same order when the same checkout is sent twice, and takes stock only once', async () => {
    const product = await makeProduct(category, { stock: 10 });
    const send = () => api().post('/api/orders').set('Idempotency-Key', KEY).send(orderPayload([orderItem(product, 2)]));

    const first = await send();
    const second = await send();

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.order.orderId).toBe(first.body.order.orderId);
    expect(second.body.replayed).toBe(true);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(product)).toBe(8);
  });

  it('handles two identical requests that arrive at the same moment', async () => {
    const product = await makeProduct(category, { stock: 10 });
    const send = () => api().post('/api/orders').set('Idempotency-Key', KEY).send(orderPayload([orderItem(product)]));

    const [a, b] = await Promise.all([send(), send()]);
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(a.body.order.orderId).toBe(b.body.order.orderId);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(product)).toBe(9);
  });

  it('does not hand the order to someone with a different email', async () => {
    const product = await makeProduct(category);
    await api().post('/api/orders').set('Idempotency-Key', KEY).send(orderPayload([orderItem(product)]));
    const other = await api()
      .post('/api/orders')
      .set('Idempotency-Key', KEY)
      .send(orderPayload([orderItem(product)], { email: 'someone.else@example.com' }));
    expect(other.status).toBe(409);
  });

  it('treats a missing or malformed key as no key (two separate orders)', async () => {
    const product = await makeProduct(category, { stock: 10 });
    await api().post('/api/orders').set('Idempotency-Key', 'short').send(orderPayload([orderItem(product)]));
    await api().post('/api/orders').set('Idempotency-Key', 'short').send(orderPayload([orderItem(product)]));
    expect(await Order.countDocuments()).toBe(2);
  });
});

describe('cancelling and order status', () => {
  it('lets a customer cancel their own order once, and gives the stock back once', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 10 });
    const placed = await placeOrder(agent, [orderItem(product, 2)]);
    expect(await stockOf(product)).toBe(8);

    const cancel = await agent.post(`/api/orders/${placed.body.order.orderId}/cancel`).send({});
    expect(cancel.status).toBe(200);
    expect(cancel.body.order.status).toBe('Cancelled');
    expect(await stockOf(product)).toBe(10);

    const again = await agent.post(`/api/orders/${placed.body.order.orderId}/cancel`).send({});
    expect(again.status).toBe(400);
    expect(await stockOf(product)).toBe(10); // not restored a second time
  });

  it('does not let a customer cancel once the order is being processed', async () => {
    const { agent } = await customerAgent();
    const admin = await adminAgent();
    const product = await makeProduct(category);
    const placed = await placeOrder(agent, [orderItem(product)]);

    await admin.agent.put(`/api/admin/orders/${placed.body.order.id}`).send({ status: 'Processing' });
    const res = await agent.post(`/api/orders/${placed.body.order.orderId}/cancel`).send({});
    expect(res.status).toBe(400);
  });

  it('keeps orders private to their owner', async () => {
    const owner = await customerAgent();
    const other = await customerAgent();
    const product = await makeProduct(category);
    const placed = await placeOrder(owner.agent, [orderItem(product)]);
    const orderId = placed.body.order.orderId;

    expect((await owner.agent.get(`/api/orders/${orderId}`)).status).toBe(200);
    expect((await other.agent.get(`/api/orders/${orderId}`)).status).toBe(404);
    expect((await other.agent.post(`/api/orders/${orderId}/cancel`).send({})).status).toBe(404);
    expect((await other.agent.get('/api/orders')).body.orders).toHaveLength(0);
    expect((await owner.agent.get('/api/orders')).body.orders).toHaveLength(1);
  });

  it('lets an admin move an order along; delivering marks it paid and makes it final', async () => {
    const admin = await adminAgent();
    const product = await makeProduct(category);
    const placed = await placeOrder(api(), [orderItem(product)]);
    const id = placed.body.order.id;

    const confirmed = await admin.agent.put(`/api/admin/orders/${id}`).send({ status: 'Confirmed', note: 'Called the customer' });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.order.status).toBe('Confirmed');

    const shipped = await admin.agent.post(`/api/admin/orders/${id}/ship`).send({});
    expect(shipped.body.order.status).toBe('Shipped');

    const delivered = await admin.agent.post(`/api/admin/orders/${id}/deliver`).send({});
    expect(delivered.body.order).toMatchObject({ status: 'Delivered', paymentStatus: 'paid' });
    expect(delivered.body.order.deliveredAt).toBeTruthy();
    expect(delivered.body.order.statusHistory.map((h) => h.status)).toEqual(['Order Placed', 'Confirmed', 'Shipped', 'Delivered']);

    expect((await admin.agent.put(`/api/admin/orders/${id}`).send({ status: 'Processing' })).status).toBe(400);
    expect((await admin.agent.post(`/api/admin/orders/${id}/cancel`).send({})).status).toBe(400);
  });

  it('restores stock exactly once when an admin cancels', async () => {
    const admin = await adminAgent();
    const product = await makeProduct(category, { stock: 10 });
    const placed = await placeOrder(api(), [orderItem(product, 3)]);
    const id = placed.body.order.id;
    expect(await stockOf(product)).toBe(7);

    const cancel = await admin.agent.post(`/api/admin/orders/${id}/cancel`).send({ note: 'Customer asked to cancel' });
    expect(cancel.body.order).toMatchObject({ status: 'Cancelled', cancelReason: 'Customer asked to cancel' });
    expect(await stockOf(product)).toBe(10);

    expect((await admin.agent.post(`/api/admin/orders/${id}/cancel`).send({})).status).toBe(400);
    expect(await stockOf(product)).toBe(10);
  });

  it('rejects an unknown status', async () => {
    const admin = await adminAgent();
    const product = await makeProduct(category);
    const placed = await placeOrder(api(), [orderItem(product)]);
    expect((await admin.agent.put(`/api/admin/orders/${placed.body.order.id}`).send({ status: 'Teleported' })).status).toBe(400);
  });
});

describe('order tracking', () => {
  it('needs the order ID plus the phone or email used, in any format', async () => {
    const product = await makeProduct(category);
    const placed = await placeOrder(api(), [orderItem(product)], { phone: '03001234567', email: 'sara@example.com' });
    const orderId = placed.body.order.orderId;
    const track = (contact, id = orderId) => api().post('/api/orders/track').send({ orderId: id, contact });

    expect((await track('03001234567')).status).toBe(200);
    expect((await track('+92 300 1234567')).status).toBe(200);
    expect((await track('0300-1234567')).status).toBe(200);
    expect((await track('  SARA@Example.com ')).status).toBe(200);
    expect((await track('03001234567', orderId.toLowerCase())).status).toBe(200);

    const wrongPhone = await track('03119999999');
    const wrongOrder = await track('03001234567', 'CZ-000000-AAAAAA');
    expect(wrongPhone.status).toBe(404);
    expect(wrongOrder.status).toBe(404);
    expect(wrongPhone.body.message).toBe(wrongOrder.body.message); // does not reveal which part was wrong
  });

  it('shows the progress, but never the street address or account details', async () => {
    const product = await makeProduct(category);
    const placed = await placeOrder(api(), [orderItem(product)]);
    const res = await api().post('/api/orders/track').send({ orderId: placed.body.order.orderId, contact: '03001234567' });

    expect(res.body.order).toMatchObject({ status: 'Order Placed', city: 'Rawalpindi', province: 'Punjab', customerName: 'Sara Khan' });
    expect(res.body.order.statusHistory).toHaveLength(1);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('Satellite Town');
    expect(text).not.toContain('sara@example.com');
    expect(text).not.toContain('03001234567');
  });

  it('refuses incomplete lookups', async () => {
    expect((await api().post('/api/orders/track').send({ orderId: 'CZ-1', contact: '03001234567' })).status).toBe(400);
    expect((await api().post('/api/orders/track').send({ orderId: 'CZ-260930-ABCDEF' })).status).toBe(400);
  });
});