import { z } from 'zod';
import { sanitizeText } from '../utils/text.js';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** Treats "" (empty form/query value) as "not provided". */
const emptyToUndefined = (schema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const objectId = z.string({ required_error: 'ID is required' }).regex(OBJECT_ID, 'Invalid ID');

const boolQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

const MAX_MONEY = 10_000_000;

export const imageInputSchema = z.object({
  url: z
    .string()
    .trim()
    .url('Invalid image URL')
    .max(600)
    .refine((u) => u.startsWith('https://'), 'Image URL must use https'),
  publicId: z.string().trim().max(250).default(''),
});

const specificationSchema = z.object({
  key: z.string().trim().min(1, 'Specification name is required').max(60).transform(sanitizeText),
  value: z.string().trim().min(1, 'Specification value is required').max(200).transform(sanitizeText),
});

const productShape = {
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(150, 'Product name must be at most 150 characters')
    .transform(sanitizeText),
  category: objectId,
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description must be at most 4000 characters')
    .transform(sanitizeText),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .int('Price must be a whole number')
    .min(1, 'Price must be at least 1')
    .max(MAX_MONEY, 'Price is too high'),
  salePrice: z.preprocess(
    (v) => (v === '' ? null : v),
    z.coerce
      .number({ invalid_type_error: 'Sale price must be a number' })
      .int('Sale price must be a whole number')
      .min(1, 'Sale price must be at least 1')
      .max(MAX_MONEY)
      .nullable()
      .optional()
  ),
  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .min(2, 'SKU must be at least 2 characters')
    .max(40, 'SKU must be at most 40 characters')
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU can only contain letters, numbers, dots, dashes and underscores')
    .transform((v) => v.toUpperCase()),
  stock: z.coerce
    .number({ invalid_type_error: 'Stock must be a whole number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(1_000_000)
    .default(0),
  images: z.array(imageInputSchema).max(10, 'A product can have at most 10 images').optional(),
  primaryImage: z.string().trim().max(600).optional(),
  tags: z
    .array(z.string().trim().toLowerCase().min(1).max(40).transform(sanitizeText))
    .max(20, 'A product can have at most 20 tags')
    .optional(),
  specifications: z.array(specificationSchema).max(20, 'At most 20 specifications').optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

const checkSalePrice = (data, ctx) => {
  if (data.salePrice != null && data.price != null && data.salePrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['salePrice'],
      message: 'Sale price must be lower than the regular price',
    });
  }
};

// Unknown keys (rating, soldCount, slug, discount ...) are stripped, so clients cannot set them.
export const productCreateSchema = z.object(productShape).superRefine(checkSalePrice);
export const productUpdateSchema = z.object(productShape).partial().superRefine(checkSalePrice);

export const stockUpdateSchema = z.object({
  stock: z.coerce
    .number({ invalid_type_error: 'Stock must be a whole number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(1_000_000),
});

export const deleteImageSchema = z.object({
  publicId: z.string({ required_error: 'publicId is required' }).trim().min(1).max(250),
});

// ---------------- Catalog queries ----------------

export const SORT_OPTIONS = ['newest', 'price-asc', 'price-desc', 'popular', 'rating', 'name-asc'];

const catalogShape = {
  q: emptyToUndefined(z.string().trim().max(80).optional()),
  category: emptyToUndefined(z.string().trim().max(300).optional()), // slug(s) or id(s), comma separated
  minPrice: emptyToUndefined(z.coerce.number().min(0).optional()),
  maxPrice: emptyToUndefined(z.coerce.number().min(0).optional()),
  onSale: emptyToUndefined(boolQuery.optional()),
  availability: emptyToUndefined(z.enum(['in-stock', 'out-of-stock']).optional()),
  featured: emptyToUndefined(boolQuery.optional()),
  bestSeller: emptyToUndefined(boolQuery.optional()),
  newArrival: emptyToUndefined(boolQuery.optional()),
  sort: emptyToUndefined(z.enum(SORT_OPTIONS).default('newest')),
  page: emptyToUndefined(z.coerce.number().int().min(1).max(1000).default(1)),
  limit: emptyToUndefined(z.coerce.number().int().min(1).max(48).default(12)),
};

export const catalogQuerySchema = z.object(catalogShape);

export const adminCatalogQuerySchema = z.object({
  ...catalogShape,
  status: emptyToUndefined(z.enum(['active', 'inactive']).optional()),
  stockStatus: emptyToUndefined(z.enum(['in', 'low', 'out']).optional()),
  limit: emptyToUndefined(z.coerce.number().int().min(1).max(100).default(20)),
});

export const homeQuerySchema = z.object({
  limit: emptyToUndefined(z.coerce.number().int().min(1).max(12).default(8)),
});

export const slugsQuerySchema = z.object({
  slugs: z.string({ required_error: 'slugs is required' }).trim().min(1).max(800),
});