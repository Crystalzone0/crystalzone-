import { http } from './api.js';

export const getCart = () => http.get('/cart');
export const addItem = (productId, quantity = 1) => http.post('/cart', { productId, quantity });
export const updateItem = (productId, quantity) => http.put(`/cart/${productId}`, { quantity });
export const removeItem = (productId) => http.delete(`/cart/${productId}`);
export const clearCart = () => http.delete('/cart');
export const mergeCart = (items) => http.post('/cart/merge', { items });
export const validateGuestCart = (items) => http.post('/cart/validate', { items });