/**
 * Normalises Pakistani phone numbers so "0330 5255596", "+92 330 5255596"
 * and "923305255596" all become "03305255596". Used for order tracking checks.
 * Non-Pakistani numbers are returned as digits only.
 */
export function normalizePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (digits.startsWith('0092') && digits.length === 14) return `0${digits.slice(4)}`;
  if (digits.startsWith('92') && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith('3')) return `0${digits}`;
  return digits;
}