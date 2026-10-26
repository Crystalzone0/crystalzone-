import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import * as cartApi from '../services/cartApi.js';
import { getErrorMessage } from '../services/api.js';
import { storage } from '../utils/storage.js';
import { STORAGE_KEYS, MAX_LINE_QUANTITY } from '../utils/constants.js';

const EMPTY_CART = {
  items: [],
  summary: {
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    shippingFee: 0,
    total: 0,
    freeShipping: false,
    freeShippingThreshold: 0,
    amountToFreeShipping: 0,
  },
  removedCount: 0,
  hasIssues: false,
};

/** Guest cart kept in the browser: [{ productId, quantity }]. Prices are never stored. */
function readGuestCart() {
  const raw = storage.get(STORAGE_KEYS.cart, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && typeof i.productId === 'string' && Number.isInteger(i.quantity) && i.quantity > 0)
    .slice(0, 50);
}

const writeGuestCart = (items) => storage.set(STORAGE_KEYS.cart, items);

function limitMessage(current, limit) {
  if (current === 0) return `Only ${limit} available`;
  const remaining = limit - current;
  if (remaining <= 0) return `You already have the maximum available quantity (${limit}) in your cart`;
  return `You already have ${current} in your cart. Only ${remaining} more available`;
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id ?? null;

  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(() => new Set());

  const cartRef = useRef(cart);
  cartRef.current = cart;
  const requestId = useRef(0);

  const applyCart = useCallback((view) => {
    setCart(view);
    setError(null);
  }, []);

  /** Guest cart: ask the server for live prices and stock, then store back what it corrected. */
  const refreshGuest = useCallback(async () => {
    const id = (requestId.current += 1);
    const items = readGuestCart();

    if (items.length === 0) {
      setCart(EMPTY_CART);
      setError(null);
      return;
    }

    const data = await cartApi.validateGuestCart(items);
    if (id !== requestId.current) return; // a newer request replaced this one

    writeGuestCart(data.cart.items.map((line) => ({ productId: line.productId, quantity: line.quantity })));
    setCart(data.cart);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (userId) applyCart((await cartApi.getCart()).cart);
    else await refreshGuest();
  }, [userId, applyCart, refreshGuest]);

  // Load the cart once we know who the visitor is. After login, the guest cart is merged into the account.
  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (userId) {
          const guest = readGuestCart();
          const data = guest.length ? await cartApi.mergeCart(guest) : await cartApi.getCart();
          if (guest.length) writeGuestCart([]); // merged (the server merge is safe to repeat)
          if (!cancelled) applyCart(data.cart);
        } else {
          await refreshGuest();
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading, applyCart, refreshGuest]);

  // Keep several open tabs in sync for guests.
  useEffect(() => {
    if (userId) return undefined;
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.cart) refreshGuest().catch(() => {});
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId, refreshGuest]);

  const setBusyFor = useCallback((productId, on) => {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  /** Runs a cart change, shows a toast on failure, returns true/false. */
  const run = useCallback(
    async (productId, task) => {
      setBusyFor(productId, true);
      try {
        await task();
        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        setBusyFor(productId, false);
      }
    },
    [setBusyFor]
  );

  const addItem = useCallback(
    async (product, quantity = 1) => {
      if (!product?.id) return false;
      if (product.stock <= 0) {
        toast.error('Sorry, this product is out of stock');
        return false;
      }

      return run(product.id, async () => {
        if (userId) {
          const data = await cartApi.addItem(product.id, quantity);
          applyCart(data.cart);
        } else {
          const items = readGuestCart();
          const existing = items.find((i) => i.productId === product.id);
          const current = existing ? existing.quantity : 0;
          const limit = Math.min(product.stock, MAX_LINE_QUANTITY);
          if (current + quantity > limit) throw new Error(limitMessage(current, limit));

          if (existing) existing.quantity = current + quantity;
          else items.push({ productId: product.id, quantity });
          writeGuestCart(items);
          await refreshGuest();
        }
        toast.success('Added to cart');
      });
    },
    [userId, run, applyCart, refreshGuest]
  );

  const removeItem = useCallback(
    async (productId) =>
      run(productId, async () => {
        if (userId) {
          const data = await cartApi.removeItem(productId);
          applyCart(data.cart);
        } else {
          writeGuestCart(readGuestCart().filter((i) => i.productId !== productId));
          await refreshGuest();
        }
        toast.success('Removed from cart');
      }),
    [userId, run, applyCart, refreshGuest]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (quantity < 1) return removeItem(productId);

      return run(productId, async () => {
        if (userId) {
          const data = await cartApi.updateItem(productId, quantity);
          applyCart(data.cart);
        } else {
          const line = cartRef.current.items.find((i) => i.productId === productId);
          if (line && quantity > line.maxQuantity) throw new Error(`Only ${line.maxQuantity} available`);

          writeGuestCart(readGuestCart().map((i) => (i.productId === productId ? { ...i, quantity } : i)));
          await refreshGuest();
        }
      });
    },
    [userId, run, removeItem, applyCart, refreshGuest]
  );

  const clearCart = useCallback(async () => {
    try {
      if (userId) applyCart((await cartApi.clearCart()).cart);
      else {
        writeGuestCart([]);
        await refreshGuest();
      }
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    }
  }, [userId, applyCart, refreshGuest]);

  /** Call after an order is placed: takes the purchased products out of the cart. */
  const afterOrder = useCallback(
    async (productIds = []) => {
      try {
        if (userId) {
          applyCart((await cartApi.getCart()).cart); // the server already removed them
        } else {
          const bought = new Set(productIds);
          writeGuestCart(readGuestCart().filter((i) => !bought.has(i.productId)));
          await refreshGuest();
        }
      } catch {
        /* the cart page will refresh on its own */
      }
    },
    [userId, applyCart, refreshGuest]
  );

  const value = useMemo(
    () => ({
      cart,
      items: cart.items,
      summary: cart.summary,
      count: cart.summary.itemCount,
      loading,
      error,
      busy,
      isBusy: (productId) => busy.has(productId),
      isInCart: (productId) => cart.items.some((i) => i.productId === productId),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
      afterOrder,
      applyCart,
    }),
    [cart, loading, error, busy, addItem, updateQuantity, removeItem, clearCart, refresh, afterOrder, applyCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}