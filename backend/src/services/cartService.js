import Cart from '../models/Cart.js';
import AppError from '../utils/AppError.js';
import { findVisibleProduct, findVisibleProducts } from './catalogVisibility.js';
import { calculateTotals } from './pricingService.js';
import { getSettings } from './settingsService.js';

export const MAX_LINE_QUANTITY = 20;

// ---------------------------------------------------------------- helpers

function serializeLine(product, quantity, adjusted) {
  const outOfStock = product.stock <= 0;
  const finalPrice = product.effectivePrice;

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    image: product.primaryImage,
    category: product.category?.name || '',
    price: product.price,
    salePrice: product.salePrice ?? null,
    finalPrice,
    discount: product.discount,
    stock: product.stock,
    quantity,
    lineTotal: finalPrice * quantity,
    maxQuantity: outOfStock ? 0 : Math.min(product.stock, MAX_LINE_QUANTITY),
    available: !outOfStock,
    adjusted,
  };
}

/**
 * rawItems: [{ productId, quantity }]
 * Looks every product up in the database and returns the lines with live prices and stock.
 *  - deleted / hidden products are dropped (counted in removedCount)
 *  - quantities are clamped to the real stock (line.adjusted = true)
 *  - out-of-stock products stay as lines with available = false
 *  - duplicate product ids are merged
 */
export async function hydrateItems(rawItems) {
  const wanted = new Map();
  for (const { productId, quantity } of rawItems) {
    const id = String(productId);
    wanted.set(id, (wanted.get(id) || 0) + quantity);
  }

  const products = await findVisibleProducts([...wanted.keys()]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  let removedCount = 0;

  for (const [id, requested] of wanted) {
    const product = byId.get(id);
    if (!product) {
      removedCount += 1;
      continue;
    }

    const capped = Math.min(requested, MAX_LINE_QUANTITY);
    const outOfStock = product.stock <= 0;
    const quantity = outOfStock ? capped : Math.min(capped, product.stock);

    lines.push(serializeLine(product, quantity, !outOfStock && quantity < requested));
  }

  return { lines, removedCount };
}

/** Turns hydrated lines into the API response (totals only count available lines). */
export function buildCartResponse({ lines, removedCount }, settings) {
  const summary = calculateTotals(
    lines.filter((line) => line.available),
    settings
  );

  return {
    items: lines,
    summary,
    removedCount,
    hasIssues: removedCount > 0 || lines.some((line) => !line.available || line.adjusted),
  };
}

/**
 * Loads a cart document, lets `mutator` change it, and saves.
 * Retries when two requests change the same cart at the same moment.
 */
async function withCart(userId, mutator) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      let cart = await Cart.findOne({ user: userId });
      if (!cart) cart = new Cart({ user: userId, items: [] });
      await mutator(cart);
      await cart.save();
      return cart;
    } catch (err) {
      const raced = err.name === 'VersionError' || err.code === 11000;
      if (!raced || attempt >= 2) throw err;
    }
  }
}

function limitError(current, limit) {
  if (current === 0) return new AppError(`Only ${limit} available`, 400);
  const remaining = limit - current;
  if (remaining <= 0) {
    return new AppError(`You already have the maximum available quantity (${limit}) in your cart`, 400);
  }
  return new AppError(`You already have ${current} in your cart. Only ${remaining} more available`, 400);
}

// ---------------------------------------------------------------- logged-in customers

/** The customer's cart with live prices, stock and totals. Fixes stale carts as a side effect. */
export async function getUserCartView(userId) {
  const [cart, settings] = await Promise.all([Cart.findOne({ user: userId }), getSettings()]);

  const raw = (cart?.items || []).map((item) => ({
    productId: String(item.product),
    quantity: item.quantity,
  }));
  const hydrated = await hydrateItems(raw);

  if (cart) {
    const inSync =
      cart.items.length === hydrated.lines.length &&
      cart.items.every(
        (item, i) =>
          String(item.product) === hydrated.lines[i].productId &&
          item.quantity === hydrated.lines[i].quantity
      );

    if (!inSync) {
      // Best effort. The updatedAt guard skips the fix if the cart changed while we were reading it.
      try {
        await Cart.updateOne(
          { _id: cart._id, updatedAt: cart.updatedAt },
          {
            $set: {
              items: hydrated.lines.map((l) => ({ product: l.productId, quantity: l.quantity })),
            },
          }
        );
      } catch {
        /* the next cart load will try again */
      }
    }
  }

  return buildCartResponse(hydrated, settings);
}

export async function addToCart(userId, productId, quantity) {
  const product = await findVisibleProduct(productId);
  if (!product) throw new AppError('This product is no longer available', 404);
  if (product.stock <= 0) throw new AppError('Sorry, this product is out of stock', 400);

  const limit = Math.min(product.stock, MAX_LINE_QUANTITY);

  await withCart(userId, (cart) => {
    const existing = cart.items.find((item) => String(item.product) === String(product._id));
    const current = existing ? existing.quantity : 0;

    if (current + quantity > limit) throw limitError(current, limit);

    if (existing) existing.quantity = current + quantity;
    else cart.items.push({ product: product._id, quantity });
  });
}

export async function setCartQuantity(userId, productId, quantity) {
  const product = await findVisibleProduct(productId);
  if (!product) throw new AppError('This product is no longer available', 404);
  if (product.stock <= 0) throw new AppError('Sorry, this product is out of stock', 400);

  const limit = Math.min(product.stock, MAX_LINE_QUANTITY);
  if (quantity > limit) throw new AppError(`Only ${limit} available`, 400);

  await withCart(userId, (cart) => {
    const existing = cart.items.find((item) => String(item.product) === String(product._id));
    if (!existing) throw new AppError('This item is not in your cart', 404);
    existing.quantity = quantity;
  });
}

export async function removeFromCart(userId, productId) {
  await Cart.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
}

export async function clearCart(userId) {
  await Cart.updateOne({ user: userId }, { $set: { items: [] } });
}

/**
 * Folds a guest (localStorage) cart into the customer's cart after login.
 * Takes the LARGER quantity per product, so calling merge twice never doubles anything.
 */
export async function mergeGuestCart(userId, guestItems) {
  const { lines } = await hydrateItems(guestItems);
  const buyable = lines.filter((line) => line.available);
  if (buyable.length === 0) return;

  await withCart(userId, (cart) => {
    for (const line of buyable) {
      const existing = cart.items.find((item) => String(item.product) === line.productId);
      if (existing) {
        existing.quantity = Math.min(Math.max(existing.quantity, line.quantity), line.maxQuantity);
      } else {
        cart.items.push({ product: line.productId, quantity: line.quantity });
      }
    }
  });
}

// ---------------------------------------------------------------- guests

/** Live prices, stock and totals for a cart kept in the browser. Nothing is stored. */
export async function viewGuestCart(items) {
  const [hydrated, settings] = await Promise.all([hydrateItems(items), getSettings()]);
  return buildCartResponse(hydrated, settings);
}