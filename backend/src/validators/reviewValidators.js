import { z } from 'zod';
import { sanitizeText } from '../utils/text.js';

export const createReviewSchema = z.object({
  rating: z.coerce
    .number({ invalid_type_error: 'Please choose a rating from 1 to 5' })
    .int('Please choose a rating from 1 to 5')
    .min(1, 'Please choose a rating from 1 to 5')
    .max(5, 'Please choose a rating from 1 to 5'),
  comment: z
    .string({ required_error: 'Please write a short review' })
    .trim()
    .min(3, 'Review is too short')
    .max(1000, 'Review must be at most 1000 characters')
    .transform(sanitizeText)
    .refine((v) => v.length >= 3, 'Review is too short'),
});

const blankToUndefined = (schema) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), schema);

export const reviewListQuerySchema = z.object({
  page: blankToUndefined(z.coerce.number().int().min(1).max(1000).default(1)),
  limit: blankToUndefined(z.coerce.number().int().min(1).max(30).default(10)),
});