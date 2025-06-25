// src/api/client.js
import axios from 'axios'

const client = axios.create({
  baseURL: '/api'         // hits your Vite proxy → Nest on :3000
})

// every request, grab our token
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token')
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

export default client