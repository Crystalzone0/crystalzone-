import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Category, Product, User } from '../src/models/index.js';

export const PASSWORD = 'Passw0rd123';

let mongod;
let counter = 0;
const next = () => {
  counter += 1;
  return counter;
};

// ---------------------------------------------------------------- database

/** Starts a throwaway in-memory MongoDB and connects to it. Never touches your real database. */
export async function startDb() {
  mongod = await MongoMemoryServer.create();
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongod.getUri());
  // Build every index (unique SKU, unique slug, unique idempotency key ...) before the first test.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

// ---------------------------------------------------------------- requests

/** A request without any login (a visitor). */
export const api = () => request(app);

/** A browser-like client that keeps its cookies between requests. */
export const newAgent = () => request.agent(app);

export async function createUser(over = {}) {
  const n = next();
  return User.create({
    name: 'Test Customer',
    email: `user${n}@example.com`,
    phone: '03001234567',
    password: PASSWORD,
    role: 'customer',
    ...over,
  });
}

export async function loginAgent(user, { admin = false } = {}) {
  const agent = newAgent();
  const res = await agent
    .post(admin ? '/api/auth/admin-login' : '/api/auth/login')
    .send({ email: user.email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`Test login failed (${res.status}): ${JSON.stringify(res.body)}`);
  return agent;
}

/** A logged-in customer: { user, agent } */
export async function customerAgent(over) {
  const user = await createUser(over);
  return { user, agent: await loginAgent(user) };
}

/** A logged-in admin: { user, agent } */
export async function adminAgent(over) {
  const user = await createUser({ name: 'Store Admin', role: 'admin', ...over });
  return { user, agent: await loginAgent(user, { admin: true }) };
}

/** A valid session token issued `ageSeconds` ago (to test that a password change ends older sessions). */
export function signSession(userId, ageSeconds = 0) {
  return jwt.sign({ id: String(userId), iat: Math.floor(Date.now() / 1000) - ageSeconds }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

// ---------------------------------------------------------------- catalog

export async function makeCategory(name, over = {}) {
  return Category.create({ name: name || `Category ${next()}`, ...over });
}

export async function makeProduct(category, over = {}) {
  const n = next();
  return Product.create({
    name: `Test Product ${n}`,
    category: category._id,
    description: 'A lovely test product for the jewellery shop.',
    price: 1500,
    sku: `SKU-${n}`,
    stock: 10,
    ...over,
  });
}

// ---------------------------------------------------------------- orders

export const orderPayload = (items, over = {}) => ({
  fullName: 'Sara Khan',
  phone: '03001234567',
  email: 'sara@example.com',
  address: 'House 12, Street 4, Satellite Town',
  city: 'Rawalpindi',
  province: 'Punjab',
  postalCode: '46000',
  paymentMethod: 'cod',
  items,
  ...over,
});

export const orderItem = (product, quantity = 1) => ({ productId: String(product._id), quantity });

/** client is api() or a logged-in agent. */
export const placeOrder = (client, items, over) => client.post('/api/orders').send(orderPayload(items, over));