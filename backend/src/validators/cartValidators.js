import { z } from 'zod';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const productIdSchema = z
  .string({ required_error: 'Product is required' })
  .regex(OBJECT_ID, 'Invalid product');

const quantity = z.coerce
  .number({ invalid_type_error: 'Quantity must be a whole number' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(20, 'You can order at most 20 of one item');

export const addToCartSchema = z.object({
  productId: productIdSchema,
  quantity: quantity.default(1),
});

export const updateCartSchema = z.object({ quantity });

// A guest cart from localStorage can be stale, so quantities are only bounded loosely here.
// The server clamps each line to the real stock instead of rejecting the whole request.
export const guestCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: productIdSchema,
        quantity: z.coerce.number().int().min(1).max(999),
      })
    )
    .max(50, 'Too many items in cart'),
});

export const wishlistItemSchema = z.object({ productId: productIdSchema });

export const wishlistMergeSchema = z.object({
  productIds: z.array(productIdSchema).max(50, 'Too many items'),
});