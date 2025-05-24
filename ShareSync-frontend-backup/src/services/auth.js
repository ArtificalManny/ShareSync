import axiosInstance from '../utils/axiosConfig';
import { setTokens, getAccessToken, clearTokens } from '../utils/tokenUtils';

const API_URL = 'http://localhost:3000/api';

export const login = async (email, password) => {
  try {
    const response = await axiosInstance.post('/auth/login', { email, password });
    console.log('auth.js login - Full response:', response.data);
    if (!response.data.access_token) {
      console.error('auth.js login - No access token received in response');
      throw new Error('No access token received in response');
    }
    return response.data;
  } catch (error) {
    console.error('auth.js login - Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
};

export const register = async (firstName, lastName, email, password) => {
  try {
    const response = await axiosInstance.post('/auth/register', { firstName, lastName, email, password });
    if (!response.data.access_token) {
      throw new Error('No access token received in response');
    }
    console.log('auth.js register - Register successful, access token:', response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('auth.js register - Register failed:', error.message);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  clearTokens();
};

export const getUserData = async () => {
  try {
    const response = await axiosInstance.get('/users/me');
    if (!response.data) {
      throw new Error('No user data received');
    }
    console.log('auth.js getUserData - User data fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js getUserData - Final error:', error.message);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    const response = await axiosInstance.get(`/projects/${projectId}`);
    if (!response.data) {
      throw new Error('No project data received');
    }
    console.log('auth.js getProjectById - Project data fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error(`auth.js getProjectById - Final error for ID ${projectId}:`, error.message);
    throw error;
  }
};

export const createProject = async (title, description, category, status) => {
  try {
    const response = await axiosInstance.post('/projects', { title, description, category, status });
    console.log('auth.js createProject - Project created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js createProject - Final error:', error.message);
    throw new Error('Failed to create project: ' + (error.response?.data?.message || error.message));
  }
};

export const updateProjectStatus = async (projectId, status) => {
  try {
    const response = await axiosInstance.put(`/projects/${projectId}/status`, { status });
    console.log('auth.js updateProjectStatus - Project status updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js updateProjectStatus - Error:', error.message);
    throw error;
  }
};

export const getProjects = async () => {
  try {
    const response = await axiosInstance.get('/projects');
    console.log('auth.js getProjects - Fetched projects:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('auth.js getProjects - Error:', error.message);
    throw error;
  }
};

export const postAnnouncement = async (projectId, content) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/announcements`, { content });
    console.log('auth.js postAnnouncement - Announcement posted:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js postAnnouncement - Error:', error.message);
    throw error;
  }
};

export const updateSnapshot = async (projectId, snapshot) => {
  try {
    const response = await axiosInstance.put(`/projects/${projectId}/snapshot`, { snapshot });
    console.log('auth.js updateSnapshot - Snapshot updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js updateSnapshot - Error:', error.message);
    throw error;
  }
};

export const createTask = async (projectId, taskData) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/tasks`, taskData);
    console.log('auth.js createTask - Task created:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js createTask - Error:', error.message);
    throw error;
  }
};

export const createSubtask = async (projectId, taskId, subtaskData) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/tasks/${taskId}/subtasks`, subtaskData);
    console.log('auth.js createSubtask - Subtask created:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js createSubtask - Error:', error.message);
    throw error;
  }
};

export const uploadFile = async (projectId, fileData) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/files`, fileData);
    console.log('auth.js uploadFile - File uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js uploadFile - Error:', error.message);
    throw error;
  }
};

export const createTeam = async (projectId, teamData) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/teams`, teamData);
    console.log('auth.js createTeam - Team created:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js createTeam - Error:', error.message);
    throw error;
  }
};

export const inviteUser = async (projectId, userId, role) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/invite`, { userId, role });
    console.log('auth.js inviteUser - User invited:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js inviteUser - Error:', error.message);
    throw error;
  }
};

export const updateNotificationSettings = async (projectId, settings) => {
  try {
    const response = await axiosInstance.put(`/projects/${projectId}/notification-settings`, settings);
    console.log('auth.js updateNotificationSettings - Settings updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('auth.js updateNotificationSettings - Error:', error.message);
    throw error;
  }
};