import axios, { AxiosResponse } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // For cookies (userToken)
});

export const login = (username: string, password: string): Promise<AxiosResponse> =>
  api.post('/auth/login', { username, password });

export const register = (username: string, password: string, profilePic?: string): Promise<AxiosResponse> =>
  api.post('/auth/register', { username, password, profilePic });

export const getProjects = (): Promise<AxiosResponse> => api.get('/projects');

export const createProject = (data: any): Promise<AxiosResponse> => api.post('/projects', data);

export const shareProject = (projectId: string, users: string[]): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/share`, { users });

export const addAnnouncement = (projectId: string, data: any): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/announcements`, data);

export const addTask = (projectId: string, data: any): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/tasks`, data);

export const likeAnnouncement = (projectId: string, annId: number): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/announcements/${annId}/like`);

export const addAnnouncementComment = (projectId: string, annId: number, text: string): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/announcements/${annId}/comments`, { text });

export const addTaskComment = (projectId: string, taskId: number, text: string): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { text });

export const updateTaskStatus = (projectId: string, taskId: number, status: string): Promise<AxiosResponse> =>
  api.post(`/projects/${projectId}/tasks/${taskId}/status`, { status });

export const uploadFile = (formData: FormData): Promise<AxiosResponse> => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});