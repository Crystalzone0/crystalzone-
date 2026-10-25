import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project root (crystal-zone/). The single .env file lives here.
export const ROOT_DIR = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const noTrailingSlash = (v) => v.replace(/\/+$/, '');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  APP_URL: z.string().url().transform(noTrailingSlash).default('http://localhost:5173'),
  CLIENT_URL: z.string().url().transform(noTrailingSlash).default('http://localhost:5173'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_EXPIRES_DAYS: z.coerce.number().positive().default(7),

  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default('crystal-zone/products'),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('Crystal Zone <alizeesh619@gmail.com>'),
  ADMIN_NOTIFY_EMAIL: z.string().default(''),

  CURRENCY: z.string().default('PKR'),
  SHIPPING_FEE: z.coerce.number().min(0).default(250),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().min(0).default(5000),
  LOW_STOCK_THRESHOLD: z.coerce.number().int().min(0).default(5),

  WHATSAPP_NUMBER: z.string().default('923305255596'),
  STORE_PHONE: z.string().default('03305255596'),
  STORE_EMAIL: z.string().default('alizeesh619@gmail.com'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  throw new Error(
    `\nInvalid environment configuration. Check your .env file:\n${lines.join('\n')}\n`
  );
}

const data = parsed.data;

if (data.NODE_ENV === 'production' && /replace-with|change-me|your_/i.test(data.JWT_SECRET)) {
  throw new Error('JWT_SECRET still contains the placeholder value. Generate a real secret.');
}

// A value copied straight from .env.example ("your_cloud_name") counts as "not set".
const isSet = (v) => Boolean(v) && !/^your_/i.test(v);

export const env = Object.freeze({
  ...data,
  isProd: data.NODE_ENV === 'production',
  isDev: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  cloudinaryConfigured:
    isSet(data.CLOUDINARY_CLOUD_NAME) &&
    isSet(data.CLOUDINARY_API_KEY) &&
    isSet(data.CLOUDINARY_API_SECRET),
  smtpConfigured: isSet(data.SMTP_HOST) && isSet(data.SMTP_USER) && isSet(data.SMTP_PASS),
  distPath: path.join(ROOT_DIR, 'frontend', 'dist'),
});