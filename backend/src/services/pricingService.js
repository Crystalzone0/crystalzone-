const toWhole = (n) => Math.max(0, Math.round(Number(n) || 0));

/**
 * The single source of truth for cart AND order totals.
 *
 * lines:    [{ price, finalPrice, quantity }]   (price = regular price, finalPrice = price paid per unit)
 * settings: { shippingFee, freeShippingThreshold }
 *
 * subtotal = sum of regular price x quantity
 * discount = sum of (regular price - price paid) x quantity
 * shipping = 0 when (subtotal - discount) reaches the free-shipping threshold, otherwise the flat fee
 *            (a threshold of 0 disables free shipping; an empty cart has no shipping)
 * total    = subtotal - discount + shipping
 */
export function calculateTotals(lines, settings) {
  let subtotal = 0;
  let discount = 0;
  let itemCount = 0;

  for (const line of lines) {
    subtotal += line.price * line.quantity;
    discount += (line.price - line.finalPrice) * line.quantity;
    itemCount += line.quantity;
  }

  const afterDiscount = subtotal - discount;
  const threshold = toWhole(settings.freeShippingThreshold);
  const flatFee = toWhole(settings.shippingFee);

  const freeShipping = itemCount > 0 && threshold > 0 && afterDiscount >= threshold;
  const shippingFee = itemCount === 0 || freeShipping ? 0 : flatFee;

  return {
    itemCount,
    subtotal,
    discount,
    shippingFee,
    total: afterDiscount + shippingFee,
    freeShipping,
    freeShippingThreshold: threshold,
    amountToFreeShipping:
      itemCount > 0 && threshold > 0 && !freeShipping ? threshold - afterDiscount : 0,
  };
}