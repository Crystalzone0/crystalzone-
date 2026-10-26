/** Builds a wa.me link. "0330 5255596" and "923305255596" both work. */
export function buildWhatsAppLink(number, message = '') {
  let digits = String(number || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`; // Pakistani local format
  if (!digits) return '#';

  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}