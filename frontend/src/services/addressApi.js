import { http } from './api.js';

export const listAddresses = () => http.get('/addresses');
export const createAddress = (body) => http.post('/addresses', body);
export const updateAddress = (id, body) => http.put(`/addresses/${id}`, body);
export const deleteAddress = (id) => http.delete(`/addresses/${id}`);