import api from './api';
import { toast } from 'react-toastify';

export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch profile', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/users/me', userData);
    const updatedUser = response.data;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    toast.success('Profile updated successfully!', { position: 'top-right', autoClose: 3000 });
    return updatedUser;
  } catch (error) {
    toast.error('Failed to update profile', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await api.put('/users/notifications', preferences);
    toast.success('Notification preferences updated!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to update notification preferences', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};