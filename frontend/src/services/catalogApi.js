import { http } from './api.js';

export const getProducts = (params) => http.get('/products', params);
export const getProduct = (slug) => http.get(`/products/${encodeURIComponent(slug)}`);
export const getRelatedProducts = (slug) => http.get(`/products/${encodeURIComponent(slug)}/related`);
export const getHome = (limit) => http.get('/products/catalog/home', limit ? { limit } : undefined);
export const getFilters = () => http.get('/products/catalog/filters');
export const getBySlugs = (slugs) => http.get('/products/catalog/by-slugs', { slugs: slugs.join(',') });
export const getCategories = () => http.get('/categories');
export const getSettings = () => http.get('/settings');