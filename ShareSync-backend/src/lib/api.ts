import axios from 'axios'

export const client = axios.create({
    baseURL: 'http://localhost:3001/api',   // ← point directly at Nest
    withCredentials: true,
  })