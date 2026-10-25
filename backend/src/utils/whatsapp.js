import { env } from '../config/env.js';

/** Builds a wa.me link with a pre-filled message. */
export function buildWhatsAppLink(message = '', number = env.WHATSAPP_NUMBER) {
  const digits = String(number).replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}