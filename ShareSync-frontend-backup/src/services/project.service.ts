import api from './api';

interface ProjectData {
  title: string;
  description?: string;
}

export const createProject = async (projectData: ProjectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};