// src/api/api.ts
import axios from 'axios';
import { store } from '../store';
import { logout } from '../features/authentication/authSlice';
import myApi from '../api/api';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    if (state.auth.token) {
      config.headers.Authorization = `Bearer ${state.auth.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
