import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

const register = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password });
    console.log('Auth Service - Register success:', response.data);
    return response.data;
  } catch (err) {
    console.error('Auth Service - Register error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};

const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    console.log('Auth Service - Login success:', response.data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  } catch (err) {
    console.error('Auth Service - Login error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};

const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Auth Service - No token found for getCurrentUser');
      throw new Error('No token found');
    }
    const response = await axios.get(`${API_URL}/me`);
    console.log('Auth Service - getCurrentUser success:', response.data);
    return response.data;
  } catch (err) {
    console.error('Auth Service - getCurrentUser error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};

const updateUserProfile = async (updates) => {
  try {
    const response = await axios.put(`${API_URL}/me`, updates);
    console.log('Auth Service - updateUserProfile success:', response.data);
    return response.data;
  } catch (err) {
    console.error('Auth Service - updateUserProfile error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
  console.log('Auth Service - Logged out');
};

export default { register, login, getCurrentUser, updateUserProfile, logout };