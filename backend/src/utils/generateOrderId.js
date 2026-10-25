import { randomInt } from 'node:crypto';

// No 0/O/1/I so order IDs are easy to read out over WhatsApp or phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Example: CZ-260929-K7M2QX
 * Uniqueness is guaranteed by the unique index on Order.orderId;
 * the order service retries with a new ID on the (very rare) collision.
 */
export function generateOrderId(date = new Date()) {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `CZ-${yy}${mm}${dd}-${suffix}`;
}