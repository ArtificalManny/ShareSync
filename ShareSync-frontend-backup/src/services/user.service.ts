import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateProfile = async (updates: { profilePicture?: string; bannerPicture?: string; school?: string; job?: string }) => {
  const response = await api.put('/users/profile', updates);
  return response.data;
};