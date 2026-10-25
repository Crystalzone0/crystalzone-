import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Product } from '../src/models/index.js';
import { adminAgent, api, clearDb, makeCategory, makeProduct, startDb, stopDb } from './helpers.js';

let admin;
let category;

beforeAll(async () => {
  await startDb();
});
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  admin = await adminAgent();
  category = await makeCategory('Earrings');
});

const body = (over = {}) => ({
  name: 'Gold Hoop Earrings',
  category: String(category._id),
  description: 'Classic gold-tone hoops for everyday wear.',
  price: 1500,
  salePrice: 1200,
  sku: 'ER-001',
  stock: 10,
  ...over,
});

describe('admin product management', () => {
  it('creates a product and works out discount, final price and slug itself', async () => {
    const res = await admin.agent.post('/api/products').send(body());
    expect(res.status).toBe(201);
    expect(res.body.product).toMatchObject({ discount: 20, finalPrice: 1200, slug: 'gold-hoop-earrings', sku: 'ER-001' });
  });

  it('ignores fields a client must not control (rating, sold count, slug, discount)', async () => {
    const res = await admin.agent
      .post('/api/products')
      .send(body({ rating: 5, reviewCount: 99, soldCount: 999, discount: 99, finalPrice: 1, slug: 'hacked' }));
    expect(res.status).toBe(201);

    const stored = await Product.findOne({ sku: 'ER-001' });
    expect(stored).toMatchObject({ rating: 0, reviewCount: 0, soldCount: 0, discount: 20, finalPrice: 1200, slug: 'gold-hoop-earrings' });
  });

  it('rejects a sale price that is not lower than the price', async () => {
    const res = await admin.agent.post('/api/products').send(body({ salePrice: 1500 }));
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'salePrice')).toBe(true);
  });

  it('rejects a duplicate SKU, a missing category and bad numbers', async () => {
    await admin.agent.post('/api/products').send(body());
    expect((await admin.agent.post('/api/products').send(body({ name: 'Another' }))).status).toBe(409);
    expect((await admin.agent.post('/api/products').send(body({ sku: 'X-2', category: '507f1f77bcf86cd799439011' }))).status).toBe(400);
    expect((await admin.agent.post('/api/products').send(body({ sku: 'X-3', stock: -1 }))).status).toBe(400);
    expect((await admin.agent.post('/api/products').send(body({ sku: 'X-4', price: 0 }))).status).toBe(400);
  });

  it('updates price and sale price, and recalculates the discount', async () => {
    const created = await admin.agent.post('/api/products').send(body());
    const res = await admin.agent.put(`/api/products/${created.body.product.id}`).send({ price: 2000, salePrice: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ discount: 50, finalPrice: 1000 });

    const removed = await admin.agent.put(`/api/products/${created.body.product.id}`).send({ salePrice: null });
    expect(removed.body.product).toMatchObject({ discount: 0, finalPrice: 2000 });
  });

  it('changes stock, and deletes a product', async () => {
    const created = await admin.agent.post('/api/products').send(body());
    const id = created.body.product.id;

    const stock = await admin.agent.patch(`/api/products/${id}/stock`).send({ stock: 0 });
    expect(stock.status).toBe(200);
    expect((await Product.findById(id)).stock).toBe(0);

    expect((await admin.agent.delete(`/api/products/${id}`)).status).toBe(200);
    expect(await Product.countDocuments()).toBe(0);
  });
});

describe('public catalog', () => {
  it('lists only visible products', async () => {
    const visible = await makeProduct(category, { name: 'Visible One' });
    await makeProduct(category, { name: 'Hidden One', isActive: false });

    const res = await api().get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products.map((p) => p.name)).toEqual(['Visible One']);

    expect((await api().get(`/api/products/${visible.slug}`)).status).toBe(200);
    expect((await api().get('/api/products/hidden-one')).status).toBe(404);
  });

  it('hides products of a hidden category everywhere (list, page, related, recently viewed)', async () => {
    const hidden = await makeCategory('Secret', { isActive: false });
    const inHidden = await makeProduct(hidden, { name: 'Secret Ring' });
    const visible = await makeProduct(category, { name: 'Open Ring' });

    expect((await api().get('/api/products')).body.products.map((p) => p.name)).toEqual(['Open Ring']);
    expect((await api().get(`/api/products/${inHidden.slug}`)).status).toBe(404);
    expect((await api().get(`/api/products/${inHidden.slug}/related`)).status).toBe(404);

    const recent = await api().get(`/api/products/catalog/by-slugs?slugs=${inHidden.slug},${visible.slug}`);
    expect(recent.body.products.map((p) => p.slug)).toEqual([visible.slug]);
  });

  it('sorts and filters by the price customers actually pay', async () => {
    await makeProduct(category, { name: 'Sale Item', price: 3000, salePrice: 1000 }); // pays 1000
    await makeProduct(category, { name: 'Middle Item', price: 1500 }); // pays 1500
    await makeProduct(category, { name: 'Pricey Item', price: 2000 }); // pays 2000

    const asc = await api().get('/api/products?sort=price-asc');
    expect(asc.body.products.map((p) => p.name)).toEqual(['Sale Item', 'Middle Item', 'Pricey Item']);
    const desc = await api().get('/api/products?sort=price-desc');
    expect(desc.body.products.map((p) => p.name)).toEqual(['Pricey Item', 'Middle Item', 'Sale Item']);

    const range = await api().get('/api/products?minPrice=1200&maxPrice=1800');
    expect(range.body.products.map((p) => p.name)).toEqual(['Middle Item']);

    const onSale = await api().get('/api/products?onSale=true');
    expect(onSale.body.products.map((p) => p.name)).toEqual(['Sale Item']);
  });

  it('sorts by newest and by popularity', async () => {
    await makeProduct(category, { name: 'Old Popular', soldCount: 50 });
    await makeProduct(category, { name: 'New Quiet', soldCount: 1 });

    expect((await api().get('/api/products?sort=newest')).body.products[0].name).toBe('New Quiet');
    expect((await api().get('/api/products?sort=popular')).body.products[0].name).toBe('Old Popular');
  });

  it('searches name, partial words, SKU, tags and category name', async () => {
    const rings = await makeCategory('Rings');
    await makeProduct(category, { name: 'Gold Hoop Earrings', sku: 'ER-001', tags: ['hoops', 'everyday'] });
    await makeProduct(rings, { name: 'Pretty Thing', sku: 'RG-009' });

    const search = async (q) => (await api().get('/api/products').query({ q })).body.products.map((p) => p.name);

    expect(await search('hoop')).toEqual(['Gold Hoop Earrings']); // partial word in name and tag
    expect(await search('ER-001')).toEqual(['Gold Hoop Earrings']); // SKU
    expect(await search('everyday')).toEqual(['Gold Hoop Earrings']); // tag
    expect(await search('ring')).toEqual(['Pretty Thing']); // category name "Rings" (partial)
    expect(await search('gold earr')).toEqual(['Gold Hoop Earrings']); // every word must match
    expect(await search('zzzz')).toEqual([]);
    expect(await search('(*[')).toEqual([]); // regex characters are harmless
  });

  it('filters by category and by availability', async () => {
    const rings = await makeCategory('Rings');
    await makeProduct(category, { name: 'Earring In', stock: 5 });
    await makeProduct(category, { name: 'Earring Out', stock: 0 });
    await makeProduct(rings, { name: 'Ring In', stock: 5 });

    const earrings = await api().get(`/api/products?category=${category.slug}`);
    expect(earrings.body.products.map((p) => p.name).sort()).toEqual(['Earring In', 'Earring Out']);

    expect((await api().get('/api/products?availability=in-stock')).body.pagination.total).toBe(2);
    expect((await api().get('/api/products?availability=out-of-stock')).body.products.map((p) => p.name)).toEqual(['Earring Out']);
    expect((await api().get('/api/products?category=does-not-exist')).body.products).toEqual([]);
  });

  it('paginates', async () => {
    for (let i = 0; i < 5; i += 1) await makeProduct(category);

    const first = await api().get('/api/products?limit=2&page=1');
    expect(first.body.products).toHaveLength(2);
    expect(first.body.pagination).toMatchObject({ page: 1, total: 5, pages: 3, hasMore: true });

    const last = await api().get('/api/products?limit=2&page=3');
    expect(last.body.products).toHaveLength(1);
    expect(last.body.pagination.hasMore).toBe(false);
  });

  it('refuses invalid query values instead of guessing', async () => {
    expect((await api().get('/api/products?sort=bogus')).status).toBe(400);
    expect((await api().get('/api/products?limit=500')).status).toBe(400);
  });

  it('serves the home page collections and shop filters', async () => {
    await makeProduct(category, { name: 'Star', featured: true, bestSeller: true, newArrival: true });
    const home = await api().get('/api/products/catalog/home');
    expect(home.status).toBe(200);
    expect(home.body.featured.map((p) => p.name)).toEqual(['Star']);

    const filters = await api().get('/api/products/catalog/filters');
    expect(filters.body.categories[0]).toMatchObject({ name: 'Earrings', productCount: 1 });
    expect(filters.body.priceRange).toEqual({ min: 1500, max: 1500 });
  });
});