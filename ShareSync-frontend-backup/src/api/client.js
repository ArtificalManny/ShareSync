// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: '/api', // Vite proxy will forward /api → http://localhost:3000/api
});

// attach JWT on every request
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default client;