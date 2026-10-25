import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ContactMessage, NewsletterSubscriber, Setting } from '../src/models/index.js';
import { adminAgent, api, clearDb, makeCategory, makeProduct, orderItem, placeOrder, startDb, stopDb } from './helpers.js';

let admin;
let category;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  admin = await adminAgent();
  category = await makeCategory('Earrings');
});

describe('dashboard figures come from real orders', () => {
  it('counts sales, revenue, pending, completed and cancelled correctly', async () => {
    const product = await makeProduct(category, { price: 1500, salePrice: 1200, stock: 20 });

    const delivered = await placeOrder(api(), [orderItem(product)]); // pays 1200 + 250 delivery = 1450
    const cancelled = await placeOrder(api(), [orderItem(product)]);
    await placeOrder(api(), [orderItem(product, 2)]); // still pending: 2400 + 250 = 2650

    await admin.agent.post(`/api/admin/orders/${delivered.body.order.id}/deliver`).send({});
    await admin.agent.post(`/api/admin/orders/${cancelled.body.order.id}/cancel`).send({});

    const { stats } = (await admin.agent.get('/api/admin/dashboard')).body;
    expect(stats).toMatchObject({
      totalOrders: 3,
      completedOrders: 1,
      cancelledOrders: 1,
      pendingOrders: 1,
      totalRevenue: 1450, // delivered only
      totalSales: 1450 + 2650, // everything except cancelled
      customers: 0,
      products: 1,
    });
  });

  it('flags low stock and out of stock in the dashboard and in inventory', async () => {
    await makeProduct(category, { stock: 0 });
    await makeProduct(category, { stock: 3 });
    await makeProduct(category, { stock: 50 });

    const { stats } = (await admin.agent.get('/api/admin/dashboard')).body;
    expect(stats).toMatchObject({ lowStock: 1, outOfStock: 1 });

    const inventory = await admin.agent.get('/api/admin/inventory');
    expect(inventory.body.summary).toMatchObject({ totalProducts: 3, outOfStock: 1, lowStock: 1, inStock: 1 });
    expect(inventory.body.items[0].status).toBe('out'); // lowest stock first

    const onlyLow = await admin.agent.get('/api/admin/inventory?stockStatus=low');
    expect(onlyLow.body.items).toHaveLength(1);
  });
});

describe('contact form', () => {
  const message = { name: 'Ayesha Malik', email: 'ayesha@example.com', message: 'Do you have gold bangles?' };

  it('saves a message that the admin can read and manage', async () => {
    expect((await api().post('/api/contact').send(message)).status).toBe(201);
    expect(await ContactMessage.countDocuments()).toBe(1);

    const list = await admin.agent.get('/api/admin/messages');
    expect(list.body.messages).toHaveLength(1);
    expect(list.body.messages[0]).toMatchObject({ name: 'Ayesha Malik', status: 'new' });

    const id = list.body.messages[0].id;
    expect((await admin.agent.patch(`/api/admin/messages/${id}`).send({ status: 'resolved' })).status).toBe(200);
    expect((await admin.agent.delete(`/api/admin/messages/${id}`)).status).toBe(200);
    expect(await ContactMessage.countDocuments()).toBe(0);
  });

  it('quietly ignores bots that fill the hidden field', async () => {
    const res = await api().post('/api/contact').send({ ...message, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(await ContactMessage.countDocuments()).toBe(0);
  });

  it('rejects empty or invalid messages and strips HTML', async () => {
    expect((await api().post('/api/contact').send({ ...message, message: 'hi' })).status).toBe(400);
    expect((await api().post('/api/contact').send({ ...message, email: 'nope' })).status).toBe(400);

    await api().post('/api/contact').send({ ...message, message: '<script>alert(1)</script>Hello there' });
    expect((await ContactMessage.findOne()).message).toBe('Hello there');
  });
});

describe('newsletter', () => {
  it('saves an address once and can be exported', async () => {
    expect((await api().post('/api/newsletter/subscribe').send({ email: 'Sara@Example.com' })).status).toBe(201);
    const again = await api().post('/api/newsletter/subscribe').send({ email: 'sara@example.com' });
    expect(again.status).toBe(200);
    expect(again.body.alreadySubscribed).toBe(true);
    expect(await NewsletterSubscriber.countDocuments()).toBe(1);

    expect((await api().post('/api/newsletter/subscribe').send({ email: 'nope' })).status).toBe(400);

    const csv = await admin.agent.get('/api/admin/subscribers/export');
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain('sara@example.com');
  });
});

describe('store settings', () => {
  it('converts a local WhatsApp number to the international format and applies delivery rules to carts', async () => {
    const res = await admin.agent.put('/api/admin/settings').send({ whatsappNumber: '03305255596', shippingFee: 400, freeShippingThreshold: 0 });
    expect(res.status).toBe(200);
    expect((await Setting.getStore()).whatsappNumber).toBe('923305255596');

    const product = await makeProduct(category, { price: 9000 });
    const cart = await api().post('/api/cart/validate').send({ items: [orderItem(product)] });
    expect(cart.body.cart.summary).toMatchObject({ shippingFee: 400, freeShipping: false }); // free delivery switched off

    const publicSettings = await api().get('/api/settings');
    expect(publicSettings.body.settings.whatsappLink).toContain('923305255596');
  });

  it('rejects invalid values', async () => {
    expect((await admin.agent.put('/api/admin/settings').send({ shippingFee: -5 })).status).toBe(400);
    expect((await admin.agent.put('/api/admin/settings').send({ whatsappNumber: 'abc' })).status).toBe(400);
    expect((await admin.agent.put('/api/admin/settings').send({ socials: { instagram: 'javascript:alert(1)' } })).status).toBe(400);
  });
});