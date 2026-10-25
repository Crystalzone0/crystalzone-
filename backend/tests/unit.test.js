import { describe, expect, it } from 'vitest';
import { calculateTotals } from '../src/services/pricingService.js';
import { generateOrderId } from '../src/utils/generateOrderId.js';
import { normalizePhone } from '../src/utils/phone.js';
import { makeSlug } from '../src/utils/slug.js';
import { escapeRegex, sanitizeText } from '../src/utils/text.js';
import { buildWhatsAppLink } from '../src/utils/whatsapp.js';

const settings = { shippingFee: 250, freeShippingThreshold: 5000 };
const line = (price, finalPrice, quantity) => ({ price, finalPrice, quantity });

describe('calculateTotals (the one function behind both the cart and every order)', () => {
  it('adds the delivery fee below the free-delivery amount', () => {
    expect(calculateTotals([line(1500, 1200, 2)], settings)).toMatchObject({
      itemCount: 2,
      subtotal: 3000,
      discount: 600,
      shippingFee: 250,
      total: 2650,
      freeShipping: false,
      amountToFreeShipping: 2600,
    });
  });

  it('makes delivery free once the amount after discounts reaches the threshold', () => {
    expect(calculateTotals([line(5000, 5000, 1)], settings)).toMatchObject({ shippingFee: 0, total: 5000, freeShipping: true });
  });

  it('counts the price after discounts, not the regular price, towards free delivery', () => {
    const totals = calculateTotals([line(6000, 4000, 1)], settings);
    expect(totals.freeShipping).toBe(false);
    expect(totals.shippingFee).toBe(250);
    expect(totals.total).toBe(4250);
  });

  it('turns free delivery off when the threshold is 0', () => {
    expect(calculateTotals([line(9000, 9000, 1)], { shippingFee: 250, freeShippingThreshold: 0 })).toMatchObject({
      shippingFee: 250,
      freeShipping: false,
      amountToFreeShipping: 0,
    });
  });

  it('charges nothing for an empty cart', () => {
    expect(calculateTotals([], settings)).toMatchObject({ itemCount: 0, subtotal: 0, shippingFee: 0, total: 0, amountToFreeShipping: 0 });
  });
});

describe('utilities', () => {
  it('generates readable order IDs without confusing characters', () => {
    expect(generateOrderId()).toMatch(/^CZ-\d{6}-[A-HJ-NP-Z2-9]{6}$/);
    expect(generateOrderId(new Date(Date.UTC(2026, 8, 30)))).toMatch(/^CZ-260930-/);
  });

  it('normalises Pakistani phone numbers to one format', () => {
    for (const input of ['03305255596', '0330 5255596', '0330-5255596', '+92 330 5255596', '923305255596', '0092 330 5255596', '3305255596']) {
      expect(normalizePhone(input)).toBe('03305255596');
    }
    expect(normalizePhone('03119999999')).not.toBe('03305255596');
  });

  it('escapes search text so it can never act as a regular expression', () => {
    expect(new RegExp(escapeRegex('a.b')).test('axb')).toBe(false);
    expect(new RegExp(escapeRegex('a.b')).test('a.b')).toBe(true);
    expect(() => new RegExp(escapeRegex('(*['))).not.toThrow();
  });

  it('makes clean URL slugs', () => {
    expect(makeSlug('Gold Hoop Earrings!')).toBe('gold-hoop-earrings');
  });

  it('strips HTML from user text', () => {
    const clean = sanitizeText('<b>Hello</b> <script>alert(1)</script><img src=x onerror=alert(2)>');
    expect(clean).toContain('Hello');
    expect(clean).not.toMatch(/[<>]/);
  });

  it('builds WhatsApp links with an encoded message', () => {
    expect(buildWhatsAppLink('Hi there', '923305255596')).toBe('https://wa.me/923305255596?text=Hi%20there');
    expect(buildWhatsAppLink('', '+92 330 5255596')).toBe('https://wa.me/923305255596');
  });
});