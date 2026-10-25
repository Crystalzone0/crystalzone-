import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Category, Product, Review, User } from '../src/models/index.js';
import { CATEGORIES, DEMO_CUSTOMERS, PRODUCTS, REVIEWS } from '../src/scripts/seedData.js';
import { destroySeedData, seedDatabase } from '../src/scripts/seed.js';
import { PASSWORD, adminAgent, api, clearDb, makeCategory, makeProduct, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('seed script', () => {
  it('creates a working store that the public API can show', async () => {
    const created = await seedDatabase();
    expect(created).toEqual({ categories: CATEGORIES.length, products: PRODUCTS.length, customers: DEMO_CUSTOMERS.length, reviews: REVIEWS.length });

    const list = await api().get('/api/products?limit=48');
    expect(list.body.pagination.total).toBe(PRODUCTS.length);

    const hoops = await Product.findOne({ sku: 'ER-001' });
    expect(hoops).toMatchObject({ price: 1800, salePrice: 1400, finalPrice: 1400, discount: 22, rating: 5, reviewCount: 2 });
    expect(hoops.slug).toBe('gold-hoop-earrings');

    const home = await api().get('/api/products/catalog/home');
    expect(home.body.featured.length).toBeGreaterThan(0);
    expect((await api().get('/api/reviews/featured')).body.reviews.length).toBeGreaterThan(0);

    const filters = await api().get('/api/products/catalog/filters');
    expect(filters.body.categories).toHaveLength(CATEGORIES.length);
  });

  it('can be run again without creating duplicates or overwriting your edits', async () => {
    await seedDatabase();
    await Product.updateOne({ sku: 'ER-001' }, { price: 9999, stock: 1 });

    const second = await seedDatabase();
    expect(second).toEqual({ categories: 0, products: 0, customers: 0, reviews: 0 });
    expect(await Product.countDocuments()).toBe(PRODUCTS.length);
    expect(await Review.countDocuments()).toBe(REVIEWS.length);
    expect(await Product.findOne({ sku: 'ER-001' })).toMatchObject({ price: 9999, stock: 1 });
  });

  it('creates demo customers that nobody can log in as', async () => {
    await seedDatabase();
    const demo = DEMO_CUSTOMERS[0];
    const login = await api().post('/api/auth/login').send({ email: demo.email, password: PASSWORD });
    expect(login.status).toBe(401);
    expect(await User.countDocuments({ role: 'admin' })).toBe(0);
  });

  it('removes only its own data and keeps everything else', async () => {
    const mine = await makeCategory('My Own Category');
    const myProduct = await makeProduct(mine, { name: 'My Own Product' });
    const admin = await adminAgent();
    await seedDatabase();

    const removed = await destroySeedData();
    expect(removed).toMatchObject({ products: PRODUCTS.length, customers: DEMO_CUSTOMERS.length, reviews: REVIEWS.length, categories: CATEGORIES.length });

    expect(await Product.countDocuments({ sku: { $in: PRODUCTS.map((p) => p.sku) } })).toBe(0);
    expect(await Review.countDocuments()).toBe(0);
    expect(await Category.countDocuments({ name: { $in: CATEGORIES.map((c) => c.name) } })).toBe(0);
    expect(await Product.findById(myProduct._id)).not.toBeNull();
    expect(await Category.findById(mine._id)).not.toBeNull();
    expect(await User.findById(admin.user._id)).not.toBeNull(); // admin accounts are never touched
  });

  it('keeps a seed category if one of your own products is in it', async () => {
    await seedDatabase();
    const earrings = await Category.findOne({ name: 'Earrings' });
    const mine = await makeProduct(earrings, { name: 'My Earrings' });

    await destroySeedData();
    expect(await Category.findById(earrings._id)).not.toBeNull();
    expect(await Product.findById(mine._id)).not.toBeNull();
  });
});