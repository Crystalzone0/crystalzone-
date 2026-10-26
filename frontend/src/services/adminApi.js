import { api, http } from './api.js';

// ---- dashboard ----
export const getDashboard = () => http.get('/admin/dashboard');

// ---- products ----
export const listProducts = (params) => http.get('/admin/products', params);
export const getProduct = (id) => http.get(`/admin/products/${id}`);
export const createProduct = (body) => http.post('/products', body);
export const updateProduct = (id, body) => http.put(`/products/${id}`, body);
export const setStock = (id, stock) => http.patch(`/products/${id}/stock`, { stock });
export const deleteProduct = (id) => http.delete(`/products/${id}`);

// ---- categories ----
export const listCategories = () => http.get('/admin/categories');
export const createCategory = (body) => http.post('/categories', body);
export const updateCategory = (id, body) => http.put(`/categories/${id}`, body);
export const deleteCategory = (id) => http.delete(`/categories/${id}`);

// ---- images (multipart; the browser sets the boundary header itself) ----
export function uploadImages(files) {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  return http.post('/admin/images', form);
}
export const deleteUploadedImage = (publicId) => http.delete('/admin/images', { publicId });

// ---- inventory ----
export const getInventory = (params) => http.get('/admin/inventory', params);

// ---- orders ----
export const listOrders = (params) => http.get('/admin/orders', params);
export const getOrder = (id) => http.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, status, note) =>
  http.put(`/admin/orders/${id}`, { status, ...(note ? { note } : {}) });
export const cancelOrder = (id, note) => http.post(`/admin/orders/${id}/cancel`, note ? { note } : {});
export const shipOrder = (id, note) => http.post(`/admin/orders/${id}/ship`, note ? { note } : {});
export const deliverOrder = (id, note) => http.post(`/admin/orders/${id}/deliver`, note ? { note } : {});

// ---- customers ----
export const listCustomers = (params) => http.get('/admin/customers', params);
export const getCustomer = (id) => http.get(`/admin/customers/${id}`);
export const setCustomerStatus = (id, isActive) => http.patch(`/admin/customers/${id}/status`, { isActive });

// ---- reviews ----
export const listReviews = (params) => http.get('/admin/reviews', params);
export const moderateReview = (id, status) => http.patch(`/admin/reviews/${id}`, { status });
export const deleteReview = (id) => http.delete(`/admin/reviews/${id}`);

// ---- contact messages ----
export const listMessages = (params) => http.get('/admin/messages', params);
export const updateMessage = (id, status) => http.patch(`/admin/messages/${id}`, { status });
export const deleteMessage = (id) => http.delete(`/admin/messages/${id}`);

// ---- newsletter subscribers ----
export const listSubscribers = (params) => http.get('/admin/subscribers', params);
export const deleteSubscriber = (id) => http.delete(`/admin/subscribers/${id}`);
/** CSV of active subscribers, as a Blob (the session cookie authorises the request). */
export const exportSubscribers = () => api.get('/admin/subscribers/export', { responseType: 'blob' }).then((res) => res.data);

// ---- settings ----
export const getSettings = () => http.get('/admin/settings');
export const updateSettings = (body) => http.put('/admin/settings', body);