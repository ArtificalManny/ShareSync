import axios from 'axios';
import { getRefreshToken, setTokens, clearTokens } from './tokenUtils';

const API_URL = 'http://localhost:3000/api';
const instance = axios.create({ baseURL: API_URL });

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('axiosConfig - Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('axiosConfig - Request error:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }
        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refresh_token: refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.data.access_token) {
          throw new Error('No access token received in refresh response');
        }
        setTokens(response.data.access_token, response.data.refresh_token || refreshToken, JSON.parse(localStorage.getItem('user') || '{}'));
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('axiosConfig - Token refresh failed:', refreshError.message);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    console.error('axiosConfig - Response error:', error);
    return Promise.reject(error);
  }
);

export default instance;