import { http } from './api.js';

export const getReviews = (productId, params) => http.get(`/products/${productId}/reviews`, params);
export const createReview = (productId, body) => http.post(`/products/${productId}/reviews`, body);
export const getFeaturedReviews = () => http.get('/reviews/featured');
export const submitContact = (body) => http.post('/contact', body);
export const subscribeNewsletter = (email) => http.post('/newsletter/subscribe', { email });