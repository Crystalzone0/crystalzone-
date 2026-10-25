import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Product, Review } from '../src/models/index.js';
import { adminAgent, api, clearDb, customerAgent, makeCategory, makeProduct, orderItem, placeOrder, startDb, stopDb } from './helpers.js';

let category;
let product;
let buyer;
let admin;
let orderMongoId;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  category = await makeCategory('Earrings');
  product = await makeProduct(category);
  buyer = await customerAgent();
  admin = await adminAgent();
  const placed = await placeOrder(buyer.agent, [orderItem(product)]);
  orderMongoId = placed.body.order.id;
});

const reviewUrl = () => `/api/products/${product._id}/reviews`;
const deliver = () => admin.agent.post(`/api/admin/orders/${orderMongoId}/deliver`).send({});

describe('who can review', () => {
  it('needs a login', async () => {
    expect((await api().post(reviewUrl()).send({ rating: 5, comment: 'Lovely' })).status).toBe(401);
  });

  it('needs a delivered order that contains the product', async () => {
    const before = await buyer.agent.post(reviewUrl()).send({ rating: 5, comment: 'Lovely' });
    expect(before.status).toBe(403); // ordered, but not delivered yet

    const stranger = await customerAgent();
    await deliver();
    const noPurchase = await stranger.agent.post(reviewUrl()).send({ rating: 5, comment: 'Lovely' });
    expect(noPurchase.status).toBe(403);

    expect((await buyer.agent.get(reviewUrl())).body.eligibility).toEqual({ canReview: true, reason: null });
    expect((await stranger.agent.get(reviewUrl())).body.eligibility.reason).toBe('not-purchased');
    expect((await api().get(reviewUrl())).body.eligibility.reason).toBe('login');
  });

  it('allows one review per product per customer', async () => {
    await deliver();
    expect((await buyer.agent.post(reviewUrl()).send({ rating: 5, comment: 'Lovely' })).status).toBe(201);
    expect((await buyer.agent.post(reviewUrl()).send({ rating: 1, comment: 'Changed my mind' })).status).toBe(409);
    expect(await Review.countDocuments()).toBe(1);
  });

  it('checks the rating and text', async () => {
    await deliver();
    expect((await buyer.agent.post(reviewUrl()).send({ rating: 6, comment: 'Lovely' })).status).toBe(400);
    expect((await buyer.agent.post(reviewUrl()).send({ rating: 0, comment: 'Lovely' })).status).toBe(400);
    expect((await buyer.agent.post(reviewUrl()).send({ rating: 3, comment: '' })).status).toBe(400);
  });
});

describe('ratings and moderation', () => {
  it('updates the product rating, shows a short name, and lets an admin hide or delete the review', async () => {
    await deliver();
    const posted = await buyer.agent.post(reviewUrl()).send({ rating: 4, comment: '<b>Pretty</b> earrings' });
    expect(posted.status).toBe(201);
    expect(posted.body.review.comment).toBe('Pretty earrings'); // HTML removed
    expect(posted.body.review.name).toBe('Test C.'); // not the full name

    expect(await Product.findById(product._id)).toMatchObject({ rating: 4, reviewCount: 1 });
    const listed = await api().get(reviewUrl());
    expect(listed.body.summary).toMatchObject({ average: 4, count: 1 });
    expect(listed.body.reviews).toHaveLength(1);

    const reviewId = posted.body.review.id;
    expect((await admin.agent.patch(`/api/admin/reviews/${reviewId}`).send({ status: 'hidden' })).status).toBe(200);
    expect(await Product.findById(product._id)).toMatchObject({ rating: 0, reviewCount: 0 });
    expect((await api().get(reviewUrl())).body.reviews).toHaveLength(0);

    await admin.agent.patch(`/api/admin/reviews/${reviewId}`).send({ status: 'approved' });
    expect(await Product.findById(product._id)).toMatchObject({ rating: 4, reviewCount: 1 });

    expect((await admin.agent.delete(`/api/admin/reviews/${reviewId}`)).status).toBe(200);
    expect(await Review.countDocuments()).toBe(0);
    expect(await Product.findById(product._id)).toMatchObject({ rating: 0, reviewCount: 0 });
  });
});