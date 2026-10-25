import { z } from 'zod';
import { sanitizeText } from '../utils/text.js';
import { nameSchema, emailSchema, phoneSchema } from './authValidators.js';

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.preprocess((v) => (v === '' || v == null ? undefined : v), phoneSchema.optional()),
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(5, 'Message is too short')
    .max(2000, 'Message must be at most 2000 characters')
    .transform(sanitizeText)
    .refine((v) => v.length >= 5, 'Message is too short'),
  // Honeypot: hidden in the form, so humans leave it empty. Bots fill it.
  website: z.string().max(200).optional(),
});

export const newsletterSchema = z.object({ email: emailSchema });