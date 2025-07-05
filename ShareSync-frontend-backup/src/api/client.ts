// src/api/client.ts
import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:3001/api',  // ← this must be your Nest URL
  withCredentials: true,
})

export default client