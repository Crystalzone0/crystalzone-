import { z } from 'zod';
import { sanitizeText } from '../utils/text.js';

export const nameSchema = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters')
  .transform(sanitizeText)
  .refine((v) => v.length >= 2, 'Please enter a valid name');

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(120, 'Email is too long')
  .email('Please enter a valid email address');

export const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .regex(/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid phone number');

// bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently truncated.
export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

// Email is intentionally not editable here (changing it needs email verification).
export const updateProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required')
      .max(128),
    newPassword: passwordSchema,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });