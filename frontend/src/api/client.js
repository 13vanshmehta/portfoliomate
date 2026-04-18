import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const apiBasePath = import.meta.env.VITE_API_BASE_PATH || '/api/v1';
const legacyApiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: legacyApiUrl || `${apiBaseUrl}${apiBasePath}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
