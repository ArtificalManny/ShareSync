// /src/api/client.js
import axios from 'axios';

// Always hit the Vite dev server proxy, which forwards /api → http://localhost:3000
const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach Authorization header if we have a token
client.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('access_token'); // key you’re saving in Login.jsx
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export default client;
