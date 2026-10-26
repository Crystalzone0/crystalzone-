import { http } from './api.js';

export const getWishlist = () => http.get('/wishlist');
export const toggleItem = (productId) => http.post('/wishlist/toggle', { productId });
export const removeItem = (productId) => http.delete(`/wishlist/${productId}`);
export const moveToCart = (productId) => http.post(`/wishlist/${productId}/move-to-cart`);
export const mergeWishlist = (productIds) => http.post('/wishlist/merge', { productIds });