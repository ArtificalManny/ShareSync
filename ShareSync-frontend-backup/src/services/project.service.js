import api from './api';

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const addAnnouncement = async (projectId, message) => {
  const response = await api.post('/projects/announcement', { projectId, message });
  return response.data;
};

export const updateSnapshot = async (projectId, snapshot) => {
  const response = await api.put('/projects/snapshot', { projectId, snapshot });
  return response.data;
};

export const updateStatus = async (projectId, status) => {
  const response = await api.put('/projects/status', { projectId, status });
  return response.data;
};