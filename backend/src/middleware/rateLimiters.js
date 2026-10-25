import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { success: false, message },
  });

/** Applied to every /api request. */
export const apiLimiter = make(15, 600, 'Too many requests. Please try again in a few minutes.');

/** Login / register: slows down password guessing. Successful logins are not counted. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.isTest,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

/** Placing orders. */
export const orderLimiter = make(60, 30, 'Too many orders from this connection. Please try again later.');

/** Order tracking: stops people from guessing order IDs. */
export const trackingLimiter = make(15, 30, 'Too many tracking attempts. Please try again shortly.');

/** Contact form and newsletter: anti-spam. */
export const contactLimiter = make(60, 10, 'Too many messages. Please try again later.');
export const newsletterLimiter = make(60, 10, 'Too many sign-ups. Please try again later.');

/** Admin image uploads. */
export const uploadLimiter = make(15, 120, 'Too many uploads. Please wait a moment.');