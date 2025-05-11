const API_URL = 'http://localhost:3000/api';

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`Making ${method} request to ${API_URL}${endpoint} with token: ${token ? 'present' : 'missing'}`);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    console.log(`Response status for ${endpoint}: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        console.error(`Failed to parse error response for ${endpoint}:`, jsonError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Response data for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error.message);
    throw error;
  }
};

export const login = (email, password) => apiRequest('/auth/login', 'POST', { email, password });
export const register = (data) => apiRequest('/auth/register', 'POST', data);
export const forgotPassword = (email) => apiRequest('/auth/forgot-password', 'POST', { email });
export const resetPassword = (token, newPassword) => apiRequest('/auth/reset-password', 'POST', { token, newPassword });
export const getUserDetails = () => apiRequest('/users/me');
export const updateProfile = (data) => apiRequest('/users/profile', 'PUT', data);
export const updateNotificationPreferences = (preferences) => apiRequest('/users/notifications', 'PUT', { preferences });
export const getUserProjects = () => apiRequest('/users/projects');
export const getProjectMetrics = () => apiRequest('/projects/metrics');
export const getProjects = () => apiRequest('/projects');
export const createProject = (data) => apiRequest('/projects', 'POST', data);
export const getProject = (id) => apiRequest(`/projects/${id}`);
export const updateProject = (id, data) => apiRequest(`/projects/${id}`, 'PUT', data);
export const addPost = (projectId, data) => apiRequest(`/projects/${projectId}/posts`, 'POST', data);
export const addPostComment = (projectId, postId, data) => apiRequest(`/projects/${projectId}/posts/${postId}/comments`, 'POST', data);
export const likePost = (projectId, postId) => apiRequest(`/projects/${projectId}/posts/${postId}/like`, 'POST');
export const addTask = (projectId, data) => apiRequest(`/projects/${projectId}/tasks`, 'POST', data);
export const updateTask = (projectId, taskId, data) => apiRequest(`/projects/${projectId}/tasks/${taskId}`, 'PUT', data);
export const addSubtask = (projectId, taskId, data) => apiRequest(`/projects/${projectId}/tasks/${taskId}/subtasks`, 'POST', data);
export const addTaskComment = (projectId, taskId, data) => apiRequest(`/projects/${projectId}/tasks/${taskId}/comments`, 'POST', data);
export const likeTask = (projectId, taskId) => apiRequest(`/projects/${projectId}/tasks/${taskId}/like`, 'POST');
export const addTeam = (projectId, data) => apiRequest(`/projects/${projectId}/teams`, 'POST', data);
export const addFile = (projectId, data) => apiRequest(`/projects/${projectId}/files`, 'POST', data);
export const requestFile = (projectId, data) => apiRequest(`/projects/${projectId}/files/request`, 'POST', data);
export const shareProject = (projectId, userId) => apiRequest(`/projects/${projectId}/share`, 'POST', { userId });
export const requestShare = (projectId, userId) => apiRequest(`/projects/${projectId}/share/request`, 'POST', { userId });