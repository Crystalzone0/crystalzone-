import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js';
import { sanitizeText } from '../utils/text.js';
import { emailSchema, phoneSchema } from './authValidators.js';

const blankToUndefined = (schema) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), schema);

const page = blankToUndefined(z.coerce.number().int().min(1).max(1000).default(1));
const limit = (max, fallback) =>
  blankToUndefined(z.coerce.number().int().min(1).max(max).default(fallback));
const search = blankToUndefined(z.string().trim().max(80).optional());

const dateOnly = blankToUndefined(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
    .optional()
);

const optionalNote = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().trim().max(300).transform(sanitizeText).optional()
);

// ---------------- Orders ----------------

export const adminOrderQuerySchema = z.object({
  search,
  status: blankToUndefined(z.enum(ORDER_STATUSES).optional()),
  paymentStatus: blankToUndefined(z.enum(PAYMENT_STATUSES).optional()),
  from: dateOnly,
  to: dateOnly,
  page,
  limit: limit(100, 20),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { errorMap: () => ({ message: 'Invalid order status' }) }),
  note: optionalNote,
});

/** Used by the cancel / ship / deliver shortcuts. */
export const orderNoteSchema = z.object({ note: optionalNote });

// ---------------- Customers ----------------

export const customerQuerySchema = z.object({
  search,
  status: blankToUndefined(z.enum(['active', 'disabled']).optional()),
  page,
  limit: limit(100, 20),
});

export const customerStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive is required', invalid_type_error: 'isActive must be true or false' }),
});

// ---------------- Reviews ----------------

export const adminReviewQuerySchema = z.object({
  search,
  status: blankToUndefined(z.enum(['approved', 'hidden']).optional()),
  rating: blankToUndefined(z.coerce.number().int().min(1).max(5).optional()),
  page,
  limit: limit(100, 20),
});

export const reviewModerationSchema = z.object({
  status: z.enum(['approved', 'hidden'], { errorMap: () => ({ message: 'Status must be approved or hidden' }) }),
});

// ---------------- Messages & subscribers ----------------

export const messageQuerySchema = z.object({
  search,
  status: blankToUndefined(z.enum(['new', 'read', 'resolved']).optional()),
  page,
  limit: limit(100, 20),
});

export const messageStatusSchema = z.object({
  status: z.enum(['new', 'read', 'resolved'], { errorMap: () => ({ message: 'Invalid status' }) }),
});

export const subscriberQuerySchema = z.object({
  search,
  page,
  limit: limit(100, 50),
});

// ---------------- Settings ----------------

const whole = (max = 1_000_000) => z.coerce.number().int('Must be a whole number').min(0).max(max);

// Pakistani numbers typed as 03xx... become 923xx..., the international format wa.me links need.
const whatsappNumber = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()+-]/g, ''))
  .refine((v) => /^\d{10,15}$/.test(v), 'Enter a valid WhatsApp number, for example 03305255596')
  .transform((v) => (v.startsWith('0') ? `92${v.slice(1)}` : v));

const socialUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https:\/\/\S+$/.test(v), 'Link must start with https://');

export const settingsUpdateSchema = z.object({
  storeName: z.string().trim().min(2).max(80).transform(sanitizeText).optional(),
  tagline: z.string().trim().max(160).transform(sanitizeText).optional(),
  phone: phoneSchema.optional(),
  whatsappNumber: whatsappNumber.optional(),
  email: emailSchema.optional(),
  address: z.string().trim().max(300).transform(sanitizeText).optional(),
  currency: z.string().trim().min(1).max(5).transform(sanitizeText).optional(),
  shippingFee: whole().optional(),
  freeShippingThreshold: whole().optional(), // 0 disables free shipping
  lowStockThreshold: whole(1000).optional(),
  announcement: z.string().trim().max(200).transform(sanitizeText).optional(),
  socials: z
    .object({
      instagram: socialUrl.optional(),
      facebook: socialUrl.optional(),
      tiktok: socialUrl.optional(),
    })
    .optional(),
});