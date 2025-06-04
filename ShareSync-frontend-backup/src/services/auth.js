import axios from 'axios';

// Base URL for the API
const API_URL = 'http://localhost:3000/api/auth';

// Configure axios instance with token
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Register a new user
export const register = async (firstName, lastName, username, email, password) => {
  try {
    const response = await axiosInstance.post('/register', {
      firstName,
      lastName,
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to register');
  }
};

// Login a user
export const login = async (email, password) => {
  try {
    const response = await axiosInstance.post('/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to login');
  }
};

// Fetch user data
export const fetchUser = async () => {
  try {
    const response = await axiosInstance.get('/user');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user data');
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post('/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send password reset link');
  }
};

// Reset password
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axiosInstance.post('/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to reset password');
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await axiosInstance.put('/profile', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};