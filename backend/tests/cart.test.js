import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Cart, Product, Wishlist } from '../src/models/index.js';
import { api, clearDb, customerAgent, makeCategory, makeProduct, startDb, stopDb } from './helpers.js';

let category;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  category = await makeCategory('Earrings');
});

const id = (product) => String(product._id);

describe('guest cart (live prices and stock from the server)', () => {
  it('uses the real price, and limits the quantity to the stock', async () => {
    const product = await makeProduct(category, { price: 1500, salePrice: 1200, stock: 10 });
    const res = await api().post('/api/cart/validate').send({ items: [{ productId: id(product), quantity: 50 }] });

    expect(res.status).toBe(200);
    const [line] = res.body.cart.items;
    expect(line).toMatchObject({ quantity: 10, adjusted: true, price: 1500, finalPrice: 1200, available: true, maxQuantity: 10 });
    expect(res.body.cart.summary).toMatchObject({ subtotal: 15000, discount: 3000, shippingFee: 0, total: 12000, freeShipping: true });
  });

  it('keeps out-of-stock items visible but out of the totals, and drops deleted or hidden ones', async () => {
    const soldOut = await makeProduct(category, { stock: 0 });
    const hidden = await makeProduct(category, { isActive: false });
    const res = await api()
      .post('/api/cart/validate')
      .send({
        items: [
          { productId: id(soldOut), quantity: 1 },
          { productId: id(hidden), quantity: 1 },
          { productId: '507f1f77bcf86cd799439011', quantity: 1 },
        ],
      });

    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0]).toMatchObject({ available: false });
    expect(res.body.cart.removedCount).toBe(2);
    expect(res.body.cart.summary).toMatchObject({ itemCount: 0, total: 0 });
  });

  it('adds delivery below the free-delivery amount and shows what is missing', async () => {
    const product = await makeProduct(category, { price: 1000, stock: 5 });
    const res = await api().post('/api/cart/validate').send({ items: [{ productId: id(product), quantity: 1 }] });
    expect(res.body.cart.summary).toMatchObject({ shippingFee: 250, total: 1250, freeShipping: false, amountToFreeShipping: 4000 });
  });

  it('rejects malformed carts', async () => {
    expect((await api().post('/api/cart/validate').send({ items: [{ productId: 'nope', quantity: 1 }] })).status).toBe(400);
    expect((await api().post('/api/cart/validate').send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 0 }] })).status).toBe(400);
  });
});

describe('customer cart', () => {
  it('adds, changes and removes items', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 10 });

    const added = await agent.post('/api/cart').send({ productId: id(product), quantity: 3 });
    expect(added.status).toBe(201);
    expect(added.body.cart.items[0].quantity).toBe(3);

    const updated = await agent.put(`/api/cart/${id(product)}`).send({ quantity: 5 });
    expect(updated.body.cart.items[0].quantity).toBe(5);

    const removed = await agent.delete(`/api/cart/${id(product)}`);
    expect(removed.body.cart.items).toHaveLength(0);
  });

  it('never lets the quantity go beyond the stock', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 10 });
    await agent.post('/api/cart').send({ productId: id(product), quantity: 3 });

    const tooMany = await agent.post('/api/cart').send({ productId: id(product), quantity: 8 });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.message).toContain('Only 7 more');

    expect((await agent.put(`/api/cart/${id(product)}`).send({ quantity: 11 })).status).toBe(400);
    expect((await agent.get('/api/cart')).body.cart.items[0].quantity).toBe(3);
  });

  it('refuses out-of-stock, hidden and unknown products', async () => {
    const { agent } = await customerAgent();
    const soldOut = await makeProduct(category, { stock: 0 });
    const hidden = await makeProduct(category, { isActive: false });

    expect((await agent.post('/api/cart').send({ productId: id(soldOut), quantity: 1 })).status).toBe(400);
    expect((await agent.post('/api/cart').send({ productId: id(hidden), quantity: 1 })).status).toBe(404);
    expect((await agent.post('/api/cart').send({ productId: '507f1f77bcf86cd799439011', quantity: 1 })).status).toBe(404);
  });

  it('repairs a stale cart: lowers the quantity when stock dropped, drops deleted products', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 10 });
    const gone = await makeProduct(category, { stock: 10 });
    await agent.post('/api/cart').send({ productId: id(product), quantity: 6 });
    await agent.post('/api/cart').send({ productId: id(gone), quantity: 1 });

    await Product.updateOne({ _id: product._id }, { stock: 2 });
    await Product.deleteOne({ _id: gone._id });

    const cart = (await agent.get('/api/cart')).body.cart;
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ quantity: 2, adjusted: true });
    expect(cart.removedCount).toBe(1);
  });

  it('merges a guest cart after login using the larger quantity, so merging twice changes nothing', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 10 });
    await agent.post('/api/cart').send({ productId: id(product), quantity: 2 });

    const guest = { items: [{ productId: id(product), quantity: 5 }] };
    expect((await agent.post('/api/cart/merge').send(guest)).body.cart.items[0].quantity).toBe(5);
    expect((await agent.post('/api/cart/merge').send(guest)).body.cart.items[0].quantity).toBe(5);
  });

  it('keeps carts private to their owner', async () => {
    const a = await customerAgent();
    const b = await customerAgent();
    const product = await makeProduct(category);
    await a.agent.post('/api/cart').send({ productId: id(product), quantity: 1 });

    expect((await b.agent.get('/api/cart')).body.cart.items).toHaveLength(0);
    expect(await Cart.countDocuments()).toBe(1);
  });
});

describe('wishlist', () => {
  it('toggles, lists and removes', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category);

    expect((await agent.post('/api/wishlist/toggle').send({ productId: id(product) })).body.inWishlist).toBe(true);
    expect((await agent.get('/api/wishlist')).body).toMatchObject({ count: 1, ids: [id(product)] });

    expect((await agent.post('/api/wishlist/toggle').send({ productId: id(product) })).body.inWishlist).toBe(false);
    expect((await agent.get('/api/wishlist')).body.count).toBe(0);
  });

  it('does not duplicate, and does not accept hidden products', async () => {
    const { user, agent } = await customerAgent();
    const product = await makeProduct(category);
    const hidden = await makeProduct(category, { isActive: false });

    await agent.post('/api/wishlist').send({ productId: id(product) });
    await agent.post('/api/wishlist').send({ productId: id(product) });
    expect((await Wishlist.findOne({ user: user._id })).products).toHaveLength(1);
    expect((await agent.post('/api/wishlist').send({ productId: id(hidden) })).status).toBe(404);
  });

  it('moves an item to the cart, but keeps it when it is out of stock', async () => {
    const { agent } = await customerAgent();
    const product = await makeProduct(category, { stock: 5 });
    await agent.post('/api/wishlist').send({ productId: id(product) });

    const moved = await agent.post(`/api/wishlist/${id(product)}/move-to-cart`);
    expect(moved.status).toBe(200);
    expect(moved.body.cart.items).toHaveLength(1);
    expect((await agent.get('/api/wishlist')).body.count).toBe(0);

    const soldOut = await makeProduct(category, { stock: 5 });
    await agent.post('/api/wishlist').send({ productId: id(soldOut) });
    await Product.updateOne({ _id: soldOut._id }, { stock: 0 });

    expect((await agent.post(`/api/wishlist/${id(soldOut)}/move-to-cart`)).status).toBe(400);
    expect((await agent.get('/api/wishlist')).body.count).toBe(1); // still saved
  });

  it('merges a guest wishlist after login', async () => {
    const { agent } = await customerAgent();
    const a = await makeProduct(category);
    const b = await makeProduct(category);
    const res = await agent.post('/api/wishlist/merge').send({ productIds: [id(a), id(b), id(a)] });
    expect(res.body.count).toBe(2);
  });
});