import axios, { AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const login = async (username: string, password: string): Promise<AxiosResponse> => {
  return api.post('/auth/login', { username, password });
};

export const register = async (username: string, password: string, profilePic?: string): Promise<AxiosResponse> => {
  return api.post('/auth/register', { username, password, profilePic });
};

export const getProjects = async (): Promise<AxiosResponse> => {
  return api.get('/projects');
};

export const createProject = async (name: string, description: string, admin: string, sharedWith: string[] = [], announcements: any[] = [], tasks: any[] = []): Promise<AxiosResponse> => {
  return api.post('/projects', { name, description, admin, sharedWith, announcements, tasks });
};

export const shareProject = async (projectId: string, users: string[], admin: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/share`, { users, admin });
};

export const addAnnouncement = async (projectId: string, content: string, media: string, user: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/announcements`, { content, media, user });
};

export const addTask = async (projectId: string, title: string, assignee: string, dueDate: string, status: string, user: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/tasks`, { title, assignee, dueDate, status, user });
};

export const likeAnnouncement = async (projectId: string, annId: string, user: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/announcements/${annId}/like`, { user });
};

export const addAnnouncementComment = async (projectId: string, annId: string, text: string, user: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/announcements/${annId}/comments`, { text, user });
};

export const addTaskComment = async (projectId: string, taskId: string, text: string, user: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { text, user });
};

export const updateTaskStatus = async (projectId: string, taskId: string, status: string, user: string): Promise<AxiosResponse> => {
  return api.post(`/projects/${projectId}/tasks/${taskId}/status`, { status, user });
};

export const uploadFile = async (file: File): Promise<AxiosResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};