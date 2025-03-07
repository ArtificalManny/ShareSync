import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const register = async (username: string, password: string, profilePic?: string) => {
  const response = await api.post('/auth/register', { username, password, profilePic });
  return response.data;
};

export default api;