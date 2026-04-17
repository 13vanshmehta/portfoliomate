import api from './client';

export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const googleSignIn = (data) => api.post('/auth/google-signin', data);

export const getFirms = () => api.get('/firms');
