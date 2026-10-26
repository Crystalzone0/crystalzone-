import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import * as wishlistApi from '../services/wishlistApi.js';
import * as catalogApi from '../services/catalogApi.js';
import { getErrorMessage } from '../services/api.js';
import { storage } from '../utils/storage.js';
import { STORAGE_KEYS } from '../utils/constants.js';

const MAX_GUEST_ITEMS = 50;

/** Guest wishlist kept in the browser: [{ id, slug }], newest first. */
function readGuestWishlist() {
  const raw = storage.get(STORAGE_KEYS.wishlist, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e.id === 'string' && typeof e.slug === 'string')
    .slice(0, MAX_GUEST_ITEMS);
}

const writeGuestWishlist = (entries) => storage.set(STORAGE_KEYS.wishlist, entries);

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { addItem: addToCart, applyCart } = useCart();
  const userId = user?._id ?? null;

  const [ids, setIds] = useState(() => new Set(readGuestWishlist().map((e) => e.id)));
  const [loading, setLoading] = useState(true);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const setWished = useCallback((id, wished) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (wished) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Load the wishlist once we know who the visitor is. After login, the guest wishlist is merged in.
  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;

    (async () => {
      try {
        if (!userId) {
          setIds(new Set(readGuestWishlist().map((e) => e.id)));
          return;
        }
        const guest = readGuestWishlist();
        const data = guest.length
          ? await wishlistApi.mergeWishlist(guest.map((e) => e.id))
          : await wishlistApi.getWishlist();
        if (guest.length) writeGuestWishlist([]);
        if (!cancelled) setIds(new Set(data.ids));
      } catch {
        /* the heart buttons stay usable; the next action retries */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  /** Heart button. `product` needs { id, slug }. */
  const toggle = useCallback(
    async (product) => {
      if (!product?.id) return false;
      const wasWished = idsRef.current.has(product.id);

      if (!userId) {
        const entries = readGuestWishlist();
        if (!wasWished && entries.length >= MAX_GUEST_ITEMS) {
          toast.error('Your wishlist is full. Log in to save more.');
          return false;
        }
        writeGuestWishlist(
          wasWished
            ? entries.filter((e) => e.id !== product.id)
            : [{ id: product.id, slug: product.slug }, ...entries.filter((e) => e.id !== product.id)]
        );
        setWished(product.id, !wasWished);
        toast.success(wasWished ? 'Removed from wishlist' : 'Added to wishlist');
        return true;
      }

      setWished(product.id, !wasWished); // instant feedback, corrected by the server answer below
      try {
        const data = await wishlistApi.toggleItem(product.id);
        setWished(product.id, data.inWishlist);
        toast.success(data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
        return true;
      } catch (err) {
        setWished(product.id, wasWished);
        toast.error(getErrorMessage(err));
        return false;
      }
    },
    [userId, setWished]
  );

  const removeItem = useCallback(
    async (productId) => {
      const wasWished = idsRef.current.has(productId);
      setWished(productId, false);

      try {
        if (userId) await wishlistApi.removeItem(productId);
        else writeGuestWishlist(readGuestWishlist().filter((e) => e.id !== productId));
        toast.success('Removed from wishlist');
        return true;
      } catch (err) {
        setWished(productId, wasWished);
        toast.error(getErrorMessage(err));
        return false;
      }
    },
    [userId, setWished]
  );

  /** Wishlist page: products currently in the wishlist (newest first). */
  const fetchProducts = useCallback(async () => {
    if (userId) {
      const data = await wishlistApi.getWishlist();
      setIds(new Set(data.ids));
      return data.products;
    }

    const entries = readGuestWishlist();
    if (entries.length === 0) return [];

    const chunks = [];
    for (let i = 0; i < entries.length; i += 12) chunks.push(entries.slice(i, i + 12).map((e) => e.slug));
    const results = await Promise.all(chunks.map((slugs) => catalogApi.getBySlugs(slugs)));

    const bySlug = new Map(results.flatMap((r) => r.products).map((p) => [p.slug, p]));
    const products = entries.map((e) => bySlug.get(e.slug)).filter(Boolean);

    if (products.length !== entries.length) {
      // Some products were deleted or hidden: forget them.
      const existing = new Set(products.map((p) => p.slug));
      const kept = entries.filter((e) => existing.has(e.slug));
      writeGuestWishlist(kept);
      setIds(new Set(kept.map((e) => e.id)));
    }
    return products;
  }, [userId]);

  /** Adds one unit to the cart and removes the product from the wishlist. `product` needs { id, stock }. */
  const moveToCart = useCallback(
    async (product) => {
      if (userId) {
        try {
          const data = await wishlistApi.moveToCart(product.id);
          applyCart(data.cart);
          setWished(product.id, false);
          toast.success('Moved to cart');
          return true;
        } catch (err) {
          toast.error(getErrorMessage(err));
          return false;
        }
      }

      const added = await addToCart(product, 1);
      if (added) {
        writeGuestWishlist(readGuestWishlist().filter((e) => e.id !== product.id));
        setWished(product.id, false);
      }
      return added;
    },
    [userId, addToCart, applyCart, setWished]
  );

  const value = useMemo(
    () => ({
      ids,
      count: ids.size,
      loading,
      isWished: (productId) => ids.has(productId),
      toggle,
      removeItem,
      fetchProducts,
      moveToCart,
    }),
    [ids, loading, toggle, removeItem, fetchProducts, moveToCart]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}