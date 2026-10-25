import { z } from 'zod';
import { sanitizeText } from '../utils/text.js';
import { imageInputSchema } from './productValidators.js';

export const categorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(60, 'Category name must be at most 60 characters')
    .transform(sanitizeText),
  description: z.string().trim().max(500).transform(sanitizeText).optional(),
  image: imageInputSchema.nullable().optional(), // null removes the image
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

export const categoryUpdateSchema = categorySchema.partial();