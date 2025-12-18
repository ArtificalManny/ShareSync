// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ss.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ TEMPORARILY DISABLED AUTO-REDIRECT
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error instead of redirecting
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    
    // Only redirect on 401 if NOT a login/register request
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      console.warn('⚠️ Unauthorized - but NOT redirecting (debug mode)');
      // localStorage.removeItem('ss.token');
      // localStorage.removeItem('ss.user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
