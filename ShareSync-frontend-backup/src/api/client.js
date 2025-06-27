// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',      // all calls to client.get('/foo') → '/api/foo'
  withCredentials: false // change to true if you ever need cookies
});

// pull the fresh access_token for *every* request
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) {
    cfg.headers['Authorization'] = `Bearer ${token}`;
  }
  return cfg;
}, err => Promise.reject(err));

export default client;