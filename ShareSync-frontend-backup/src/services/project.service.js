import api from './api';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const updateProjectAnnouncement = async (projectId, message) => {
  const response = await api.post(`/projects/${projectId}/announcements`, { message });
  return response.data;
};

export const updateProjectSnapshot = async (projectId, snapshot) => {
  const response = await api.post(`/projects/${projectId}/snapshot`, { snapshot });
  return response.data;
};

export const updateProjectStatus = async (projectId, status) => {
  const response = await api.post(`/projects/${projectId}/status`, { status });
  return response.data;
};