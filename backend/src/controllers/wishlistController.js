import Wishlist from '../models/Wishlist.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { findVisibleProduct, findVisibleProducts } from '../services/catalogVisibility.js';
import { addToCart, getUserCartView } from '../services/cartService.js';

/** Adds ids to the customer's wishlist as a set (no duplicates), creating the wishlist if needed. */
async function addToSet(userId, productIds) {
  const update = { $addToSet: { products: { $each: productIds } } };
  try {
    await Wishlist.updateOne({ user: userId }, update, { upsert: true });
  } catch (err) {
    // Two requests tried to create the wishlist at once: the second simply adds to the existing one.
    if (err.code !== 11000) throw err;
    await Wishlist.updateOne({ user: userId }, update);
  }
}

/** Visible products in the wishlist, newest first. Hidden or unavailable ones are not shown. */
async function loadWishlist(userId) {
  const wishlist = await Wishlist.findOne({ user: userId });
  const ids = wishlist ? wishlist.products.map(String).reverse() : [];

  const products = await findVisibleProducts(ids);
  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  return { products: ordered, ids: ordered.map((p) => p.id), count: ordered.length };
}

/** GET /api/wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await loadWishlist(req.user._id)) });
});

/** POST /api/wishlist  { productId } */
export const addItem = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req.body.productId);
  if (!product) throw new AppError('This product is no longer available', 404);

  await addToSet(req.user._id, [product._id]);
  res.status(201).json({
    success: true,
    message: 'Added to wishlist',
    productId: product.id,
    inWishlist: true,
  });
});

/** DELETE /api/wishlist/:productId */
export const removeItem = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  res.json({
    success: true,
    message: 'Removed from wishlist',
    productId: req.params.productId,
    inWishlist: false,
  });
});

/** POST /api/wishlist/toggle  { productId }  (used by the heart button) */
export const toggleItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const already = await Wishlist.exists({ user: req.user._id, products: productId });

  if (already) {
    await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: productId } });
    return res.json({ success: true, message: 'Removed from wishlist', productId, inWishlist: false });
  }

  const product = await findVisibleProduct(productId);
  if (!product) throw new AppError('This product is no longer available', 404);

  await addToSet(req.user._id, [product._id]);
  return res.json({ success: true, message: 'Added to wishlist', productId, inWishlist: true });
});

/** POST /api/wishlist/merge  { productIds }  (guest wishlist -> account, after login) */
export const mergeWishlist = asyncHandler(async (req, res) => {
  const products = await findVisibleProducts([...new Set(req.body.productIds)]);
  if (products.length > 0) await addToSet(req.user._id, products.map((p) => p._id));

  res.json({ success: true, ...(await loadWishlist(req.user._id)) });
});

/** POST /api/wishlist/:productId/move-to-cart: adds 1 to the cart, then removes it from the wishlist. */
export const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Throws (out of stock, unavailable, quantity limit) BEFORE anything is removed from the wishlist.
  await addToCart(req.user._id, productId, 1);
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: productId } });

  res.json({
    success: true,
    message: 'Moved to cart',
    productId,
    cart: await getUserCartView(req.user._id),
  });
});