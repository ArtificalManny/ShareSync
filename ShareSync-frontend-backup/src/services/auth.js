import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  const { access_token, refresh_token, user } = response.data;
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  localStorage.setItem('user', JSON.stringify(user));
  axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  return user;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
};

export const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) {
    throw new Error('No refresh token available');
  }
  const response = await axios.post(`${API_URL}/auth/refresh-token`, { refresh_token });
  const { access_token } = response.data;
  localStorage.setItem('access_token', access_token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  return access_token;
};

export const getUserData = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/me`);
    return response.data;
  } catch (error) {
    console.error('Failed to load user data:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
};

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshToken();
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);