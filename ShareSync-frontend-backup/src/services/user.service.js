import api from './api';

export const getProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load profile');
  }
};

export const updateProfile = async (updates) => {
  try {
    const response = await api.put('/users/profile', updates);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};