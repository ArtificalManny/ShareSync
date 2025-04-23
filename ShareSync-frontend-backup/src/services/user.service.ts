import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};