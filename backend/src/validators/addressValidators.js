import { z } from 'zod';
import { sanitizeText } from '../utils/text.js';
import { nameSchema, phoneSchema } from './authValidators.js';

const requiredText = (label, min, max) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, `${label} is too short`)
    .max(max, `${label} is too long`)
    .transform(sanitizeText)
    .refine((v) => v.length >= min, `${label} is too short`);

export const addressSchema = z.object({
  label: z.string().trim().max(30).transform(sanitizeText).default('Home'),
  fullName: nameSchema,
  phone: phoneSchema,
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
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressSchema.partial();