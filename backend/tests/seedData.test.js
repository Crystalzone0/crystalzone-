import { describe, expect, it } from 'vitest';
import { CATEGORIES, DEMO_CUSTOMERS, PRODUCTS, REVIEWS } from '../src/scripts/seedData.js';

describe('seed data is valid, so the seed script can never fail on bad sample data', () => {
  it('has unique SKUs and names', () => {
    expect(new Set(PRODUCTS.map((p) => p.sku)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((p) => p.name)).size).toBe(PRODUCTS.length);
  });

  it('puts every product in a real category', () => {
    const names = new Set(CATEGORIES.map((c) => c.name));
    for (const product of PRODUCTS) expect(names.has(product.category), product.sku).toBe(true);
    for (const category of CATEGORIES) expect(PRODUCTS.some((p) => p.category === category.name), category.name).toBe(true);
  });

  it('has sensible prices, stock, tags and text', () => {
    for (const p of PRODUCTS) {
      expect(Number.isInteger(p.price) && p.price > 0, p.sku).toBe(true);
      if (p.salePrice !== null) expect(p.salePrice, p.sku).toBeLessThan(p.price);
      expect(Number.isInteger(p.stock) && p.stock >= 0, p.sku).toBe(true);
      expect(p.description.length, p.sku).toBeGreaterThanOrEqual(10);
      expect(p.tags.every((t) => t === t.toLowerCase() && t.length <= 40), p.sku).toBe(true);
      expect(p.specifications.length, p.sku).toBeGreaterThan(0);
    }
  });

  it('shows every store state: on sale, low stock and out of stock', () => {
    expect(PRODUCTS.some((p) => p.salePrice !== null)).toBe(true);
    expect(PRODUCTS.some((p) => p.stock > 0 && p.stock <= 5)).toBe(true);
    expect(PRODUCTS.some((p) => p.stock === 0)).toBe(true);
    expect(PRODUCTS.some((p) => p.featured)).toBe(true);
    expect(PRODUCTS.some((p) => p.bestSeller)).toBe(true);
    expect(PRODUCTS.some((p) => p.newArrival)).toBe(true);
  });

  it('only reviews real products, by real demo customers, once each', () => {
    const skus = new Set(PRODUCTS.map((p) => p.sku));
    const emails = new Set(DEMO_CUSTOMERS.map((c) => c.email));
    const pairs = new Set();
    for (const r of REVIEWS) {
      expect(skus.has(r.sku), r.sku).toBe(true);
      expect(emails.has(r.email), r.email).toBe(true);
      expect(r.rating >= 1 && r.rating <= 5).toBe(true);
      pairs.add(`${r.sku}:${r.email}`);
    }
    expect(pairs.size).toBe(REVIEWS.length);
  });
});