import api from './api';

export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create project');
  }
};

export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load projects');
  }
};

export const addAnnouncement = async (projectId, message) => {
  try {
    const response = await api.post('/projects/announcement', { projectId, message });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add announcement');
  }
};

export const updateSnapshot = async (projectId, snapshot) => {
  try {
    const response = await api.put('/projects/snapshot', { projectId, snapshot });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update snapshot');
  }
};

export const updateStatus = async (projectId, status) => {
  try {
    const response = await api.put('/projects/status', { projectId, status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update status');
  }
};