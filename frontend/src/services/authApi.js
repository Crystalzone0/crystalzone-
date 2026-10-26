import { http } from './api.js';

export const register = (body) => http.post('/auth/register', body);
export const login = (body) => http.post('/auth/login', body);
export const adminLogin = (body) => http.post('/auth/admin-login', body);
export const logout = () => http.post('/auth/logout');
export const getMe = () => http.get('/auth/me');
export const updateProfile = (body) => http.put('/auth/profile', body);
export const changePassword = (body) => http.put('/auth/password', body);