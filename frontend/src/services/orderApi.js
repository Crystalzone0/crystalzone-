import { http } from './api.js';

/**
 * idempotencyKey: the same key on a retry returns the order created the first time, so a dropped connection
 * can never cause a duplicate order. The longer timeout gives a slow server time to finish.
 */
export const placeOrder = (payload, idempotencyKey) =>
  http.post('/orders', payload, {
    timeout: 30000,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });

export const trackOrder = (payload) => http.post('/orders/track', payload);
export const getMyOrders = (params) => http.get('/orders', params);
export const getMyOrder = (id) => http.get(`/orders/${encodeURIComponent(id)}`);
export const cancelMyOrder = (id, reason) => http.post(`/orders/${encodeURIComponent(id)}/cancel`, { reason });