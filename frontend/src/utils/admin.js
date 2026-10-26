/** Works with an id string or a populated object ({ id } or { _id }). */
export const refId = (value) => (value && typeof value === 'object' ? (value.id ?? value._id ?? '') : (value ?? ''));

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "2026-09-30" -> "30 Sept" (for chart labels) */
export function shortDay(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return String(ymd);
  return dayFormat.format(new Date(Date.UTC(y, m - 1, d)));
}

/** 12500 -> "13k" */
export function compactNumber(n) {
  const value = Number(n) || 0;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

/** After a product/category change: refresh admin screens and everything the storefront has cached. */
export function invalidateProductCaches(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin'] });
  for (const key of ['products', 'product', 'home', 'filters', 'related', 'recently-viewed', 'on-sale-count']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}