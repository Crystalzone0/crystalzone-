import asyncHandler from '../utils/asyncHandler.js';
import {
  getUserCartView,
  addToCart,
  setCartQuantity,
  removeFromCart,
  clearCart,
  mergeGuestCart,
  viewGuestCart,
} from '../services/cartService.js';

/** GET /api/cart */
export const getCart = asyncHandler(async (req, res) => {
  res.json({ success: true, cart: await getUserCartView(req.user._id) });
});

/** POST /api/cart  { productId, quantity } */
export const addItem = asyncHandler(async (req, res) => {
  await addToCart(req.user._id, req.body.productId, req.body.quantity);
  res.status(201).json({
    success: true,
    message: 'Added to cart',
    cart: await getUserCartView(req.user._id),
  });
});

/** PUT /api/cart/:productId  { quantity } */
export const updateItem = asyncHandler(async (req, res) => {
  await setCartQuantity(req.user._id, req.params.productId, req.body.quantity);
  res.json({ success: true, message: 'Cart updated', cart: await getUserCartView(req.user._id) });
});

/** DELETE /api/cart/:productId */
export const removeItem = asyncHandler(async (req, res) => {
  await removeFromCart(req.user._id, req.params.productId);
  res.json({
    success: true,
    message: 'Removed from cart',
    cart: await getUserCartView(req.user._id),
  });
});

/** DELETE /api/cart */
export const clearAll = asyncHandler(async (req, res) => {
  await clearCart(req.user._id);
  res.json({ success: true, message: 'Cart cleared', cart: await getUserCartView(req.user._id) });
});

/** POST /api/cart/merge  { items: [{ productId, quantity }] }  (guest cart -> account cart, after login) */
export const mergeCart = asyncHandler(async (req, res) => {
  await mergeGuestCart(req.user._id, req.body.items);
  res.json({ success: true, cart: await getUserCartView(req.user._id) });
});

/** POST /api/cart/validate  { items }  Public: live prices/stock/totals for a guest cart. */
export const validateGuestCart = asyncHandler(async (req, res) => {
  res.json({ success: true, cart: await viewGuestCart(req.body.items) });
});