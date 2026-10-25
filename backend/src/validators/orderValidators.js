import { z } from 'zod';
import { PAYMENT_METHODS } from '../models/Order.js';
import { sanitizeText } from '../utils/text.js';
import { nameSchema, emailSchema, phoneSchema } from './authValidators.js';
import { productIdSchema } from './cartValidators.js';

const optionalText = (max) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().trim().max(max).transform(sanitizeText).optional()
  );

const requiredText = (label, min, max) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, `${label} is too short`)
    .max(max, `${label} is too long`)
    .transform(sanitizeText)
    .refine((v) => v.length >= min, `${label} is too short`);

const orderItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a whole number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(20, 'You can order at most 20 of one item'),
});

/**
 * Anything not listed here (price, total, discount, status, paymentStatus ...) is stripped,
 * so the client can never influence money or order state.
 */
export const placeOrderSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  address: requiredText('Address', 10, 300),
  city: requiredText('City', 2, 80),
  province: requiredText('Province', 2, 80),
  postalCode: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9\s-]{3,10}$/, 'Please enter a valid postal code')
      .optional()
  ),
  notes: optionalText(500),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cod'),
  // Guests (and "Buy now") send items. A logged-in customer may omit it to check out their saved cart.
  items: z.array(orderItemSchema).min(1, 'Your cart is empty').max(50, 'Too many items').optional(),
});

export const trackOrderSchema = z.object({
  orderId: z
    .string({ required_error: 'Order ID is required' })
    .trim()
    .toUpperCase()
    .min(6, 'Please enter your Order ID')
    .max(30, 'Please enter a valid Order ID'),
  // Phone number OR email address
  contact: z
    .string({ required_error: 'Phone number or email is required' })
    .trim()
    .min(5, 'Please enter the phone number or email used for the order')
    .max(120, 'Please enter a valid phone number or email'),
});

export const cancelOrderSchema = z.object({
  reason: optionalText(300),
});

const listNumber = (max, fallback) =>
  z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().int().min(1).max(max).default(fallback)
  );

export const orderListQuerySchema = z.object({
  page: listNumber(1000, 1),
  limit: listNumber(50, 10),
});