import axios from 'axios';

interface CreateProjectData {
  name: string;
  description: string;
  sharedWith: string[];
  creatorEmail: string;
}

interface UpdateProjectData {
  name: string;
  description: string;
}

const getProjects = async (username: string) => {
  return axios.get(`${process.env.REACT_APP_API_URL}/projects/${username}`);
};

const getProjectById = async (id: string) => {
  return axios.get(`${process.env.REACT_APP_API_URL}/projects/by-id/${id}`);
};

const createProject = async (data: CreateProjectData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/projects`, data);
};

const updateProject = async (id: string, data: UpdateProjectData) => {
  return axios.put(`${process.env.REACT_APP_API_URL}/projects/${id}`, data);
};

const deleteProject = async (id: string) => {
  return axios.delete(`${process.env.REACT_APP_API_URL}/projects/${id}`);
};

const projectsService = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};

export default projectsService;