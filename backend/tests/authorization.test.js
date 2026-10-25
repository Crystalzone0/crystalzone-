import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { User } from '../src/models/index.js';
import { adminAgent, api, customerAgent, startDb, stopDb } from './helpers.js';

const ID = '507f1f77bcf86cd799439011'; // any valid-looking id: the access check happens before it is looked up

// Every admin route. A customer must NEVER get through, and a visitor must be asked to log in.
const ADMIN_ROUTES = [
  ['get', '/api/admin/dashboard'],
  ['get', '/api/admin/orders'],
  ['get', `/api/admin/orders/${ID}`],
  ['put', `/api/admin/orders/${ID}`],
  ['post', `/api/admin/orders/${ID}/cancel`],
  ['post', `/api/admin/orders/${ID}/ship`],
  ['post', `/api/admin/orders/${ID}/deliver`],
  ['get', '/api/admin/customers'],
  ['get', `/api/admin/customers/${ID}`],
  ['patch', `/api/admin/customers/${ID}/status`],
  ['get', '/api/admin/products'],
  ['get', `/api/admin/products/${ID}`],
  ['get', '/api/admin/categories'],
  ['get', '/api/admin/inventory'],
  ['get', '/api/admin/reviews'],
  ['patch', `/api/admin/reviews/${ID}`],
  ['delete', `/api/admin/reviews/${ID}`],
  ['get', '/api/admin/messages'],
  ['patch', `/api/admin/messages/${ID}`],
  ['delete', `/api/admin/messages/${ID}`],
  ['get', '/api/admin/subscribers'],
  ['get', '/api/admin/subscribers/export'],
  ['delete', `/api/admin/subscribers/${ID}`],
  ['get', '/api/admin/settings'],
  ['put', '/api/admin/settings'],
  ['post', '/api/admin/images'],
  ['delete', '/api/admin/images'],
  // admin actions that live outside /api/admin
  ['post', '/api/products'],
  ['put', `/api/products/${ID}`],
  ['patch', `/api/products/${ID}/stock`],
  ['delete', `/api/products/${ID}`],
  ['post', '/api/categories'],
  ['put', `/api/categories/${ID}`],
  ['delete', `/api/categories/${ID}`],
];

let customer;
let admin;

beforeAll(async () => {
  await startDb();
  customer = await customerAgent();
  admin = await adminAgent();
});
afterAll(stopDb);

describe('admin API protection', () => {
  it.each(ADMIN_ROUTES)('%s %s asks a visitor to log in (401)', async (method, path) => {
    const res = await api()[method](path);
    expect(res.status).toBe(401);
  });

  it.each(ADMIN_ROUTES)('%s %s refuses a logged-in customer (403)', async (method, path) => {
    const res = await customer.agent[method](path);
    expect(res.status).toBe(403);
  });

  it.each([
    '/api/admin/dashboard',
    '/api/admin/orders',
    '/api/admin/customers',
    '/api/admin/products',
    '/api/admin/categories',
    '/api/admin/inventory',
    '/api/admin/reviews',
    '/api/admin/messages',
    '/api/admin/subscribers',
    '/api/admin/settings',
  ])('lets an admin open %s (200)', async (path) => {
    const res = await admin.agent.get(path);
    expect(res.status).toBe(200);
  });
});

describe('customers cannot reach each other or the store owner', () => {
  it('does not let an admin disable another admin through the customers screen', async () => {
    const other = await adminAgent();
    const res = await admin.agent.patch(`/api/admin/customers/${other.user._id}/status`).send({ isActive: false });
    expect(res.status).toBe(404);
    expect((await User.findById(other.user._id)).isActive).toBe(true);
  });

  it('lets an admin disable a customer, who is then blocked on their very next request', async () => {
    const victim = await customerAgent();
    expect((await victim.agent.get('/api/cart')).status).toBe(200);

    const res = await admin.agent.patch(`/api/admin/customers/${victim.user._id}/status`).send({ isActive: false });
    expect(res.status).toBe(200);
    expect((await victim.agent.get('/api/cart')).status).toBe(403);

    await admin.agent.patch(`/api/admin/customers/${victim.user._id}/status`).send({ isActive: true });
    expect((await victim.agent.get('/api/cart')).status).toBe(200);
  });

  it('never includes password hashes in any customer data an admin can read', async () => {
    const list = await admin.agent.get('/api/admin/customers');
    expect(JSON.stringify(list.body)).not.toMatch(/\$2[aby]\$/);
    expect(JSON.stringify(list.body)).not.toContain('"password"');
  });
});