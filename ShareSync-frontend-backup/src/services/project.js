import axios from 'axios';

// Base URL for the API
const API_URL = 'http://localhost:3000/api/projects';

// Configure axios instance with token
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Create a new project
export const createProject = async (projectData) => {
  try {
    const response = await axiosInstance.post('/', projectData);
    return response.data;
  } catch (error) {
    console.error('Create project error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create project');
  }
};

// Fetch all projects for the current user
export const fetchProjects = async () => {
  try {
    const response = await axiosInstance.get('/');
    return response.data;
  } catch (error) {
    console.error('Fetch projects error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch projects');
  }
};

// Fetch a specific project by ID
export const fetchProjectById = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Fetch project error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch project');
  }
};

// Update a project
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axiosInstance.put(`/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error('Update project error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update project');
  }
};

// Create a post in a project
export const createPost = async (projectId, postData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/posts`, postData);
    return response.data;
  } catch (error) {
    console.error('Create post error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create post');
  }
};

// Create a task in a project
export const createTask = async (projectId, taskData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error('Create task error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create task');
  }
};

// Create a subtask in a task
export const createSubtask = async (projectId, taskId, subtaskData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/tasks/${taskId}/subtasks`, subtaskData);
    return response.data;
  } catch (error) {
    console.error('Create subtask error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create subtask');
  }
};

// Update a task's status
export const updateTaskStatus = async (projectId, taskId, status) => {
  try {
    const response = await axiosInstance.put(`/${projectId}/tasks/${taskId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Update task status error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update task status');
  }
};

// Like a task
export const likeTask = async (projectId, taskId) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/tasks/${taskId}/like`);
    return response.data;
  } catch (error) {
    console.error('Like task error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to like task');
  }
};

// Share a task
export const shareTask = async (projectId, taskId) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/tasks/${taskId}/share`);
    return response.data;
  } catch (error) {
    console.error('Share task error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to share task');
  }
};

// Add a comment to a task
export const addTaskComment = async (projectId, taskId, commentData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/tasks/${taskId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error('Add task comment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add comment');
  }
};

// Upload a file to a project
export const uploadFile = async (projectId, fileData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/files`, fileData);
    return response.data;
  } catch (error) {
    console.error('Upload file error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to upload file');
  }
};

// Approve or reject a file
export const approveFile = async (projectId, fileId, status) => {
  try {
    const response = await axiosInstance.put(`/${projectId}/files/${fileId}/approve`, { status });
    return response.data;
  } catch (error) {
    console.error('Approve file error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update file status');
  }
};

// Create a team in a project
export const createTeam = async (projectId, teamData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/teams`, teamData);
    return response.data;
  } catch (error) {
    console.error('Create team error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create team');
  }
};

// Invite a user to a project
export const inviteUser = async (projectId, email) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/invite`, { email });
    return response.data;
  } catch (error) {
    console.error('Invite user error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to invite user');
  }
};

// Add a suggestion to a project
export const addSuggestion = async (projectId, suggestionData) => {
  try {
    const response = await axiosInstance.post(`/${projectId}/suggestions`, suggestionData);
    return response.data;
  } catch (error) {
    console.error('Add suggestion error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add suggestion');
  }
};

// Update project notification settings
export const updateNotificationSettings = async (projectId, settings) => {
  try {
    const response = await axiosInstance.put(`/${projectId}/settings/notifications`, settings);
    return response.data;
  } catch (error) {
    console.error('Update notification settings error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update notification settings');
  }
};

// Fetch leaderboard for a project
export const fetchLeaderboard = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/${projectId}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('Fetch leaderboard error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard');
  }
};