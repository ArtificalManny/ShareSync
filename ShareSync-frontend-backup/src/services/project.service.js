import api from './api';
import { toast } from 'react-toastify';

export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch projects', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    toast.success('Project created successfully!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to create project', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateProjectAnnouncement = async (projectId, announcementData) => {
  try {
    const response = await api.post(`/projects/${projectId}/announcements`, announcementData);
    toast.success('Announcement posted!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to post announcement', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateProjectSnapshot = async (projectId, snapshot) => {
  try {
    const response = await api.post(`/projects/${projectId}/snapshot`, { snapshot });
    toast.success('Snapshot updated!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to update snapshot', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateProjectStatus = async (projectId, status) => {
  try {
    const response = await api.post(`/projects/${projectId}/status`, { status });
    toast.success(`Project status updated to ${status}!`, { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to update project status', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const createTask = async (projectId, taskData) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    toast.success('Task created successfully!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to create task', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateTaskStatus = async (projectId, taskId, status) => {
  try {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}/status`, { status });
    toast.success(`Task status updated to ${status}!`, { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to update task status', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const addComment = async (projectId, taskId, commentData) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, commentData);
    toast.success('Comment added!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to add comment', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const likeItem = async (projectId, itemId, type) => {
  try {
    const response = await api.post(`/projects/${projectId}/${type}/${itemId}/like`);
    toast.success('Liked!', { position: 'top-right', autoClose: 2000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to like', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const shareItem = async (projectId, itemId, type) => {
  try {
    const response = await api.post(`/projects/${projectId}/${type}/${itemId}/share`);
    toast.success('Shared!', { position: 'top-right', autoClose: 2000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to share', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const uploadFile = async (projectId, fileData) => {
  try {
    const response = await api.post(`/projects/${projectId}/files`, fileData);
    toast.success('File uploaded for review!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to upload file', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const approveFile = async (projectId, fileId, status) => {
  try {
    const response = await api.put(`/projects/${projectId}/files/${fileId}/status`, { status });
    toast.success(`File ${status}!`, { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error(`Failed to ${status} file`, { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const createTeam = async (projectId, teamData) => {
  try {
    const response = await api.post(`/projects/${projectId}/teams`, teamData);
    toast.success('Team created successfully!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to create team', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const inviteMember = async (projectId, inviteData) => {
  try {
    const response = await api.post(`/projects/${projectId}/members/invite`, inviteData);
    toast.success('Invitation sent!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to send invitation', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const updateNotificationSettings = async (projectId, settings) => {
  try {
    const response = await api.put(`/projects/${projectId}/notifications`, settings);
    toast.success('Notification settings updated!', { position: 'top-right', autoClose: 3000 });
    return response.data;
  } catch (error) {
    toast.error('Failed to update notification settings', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};