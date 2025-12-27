// src/api/projects.js - ENHANCED WITH TASKS & SHIPS
import api from './client';

// ============================================
// PROJECTS
// ============================================

/**
 * Get all projects for current user
 * @returns {Promise} Array of projects
 */
export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

/**
 * Get quick list of projects (limited data for sidebar/nav)
 * @returns {Promise} Array of { _id, title }
 */
export const getProjectsQuick = async () => {
  const response = await api.get('/projects/quick');
  return response.data;
};

/**
 * Get single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise} Project data
 */
export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

/**
 * Create a new project
 * @param {object} projectData - { title, description, status, privacy }
 * @returns {Promise} Created project
 */
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {object} updates - Fields to update
 * @returns {Promise} Updated project
 */
export const updateProject = async (projectId, updates) => {
  const response = await api.put(`/projects/${projectId}`, updates);
  return response.data;
};

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise}
 */
export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// ============================================
// TASKS
// ============================================

/**
 * Get all tasks for a project
 * @param {string} projectId - Project ID
 * @returns {Promise} Array of tasks
 */
export const getTasks = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data;
};

/**
 * Create a new task
 * @param {string} projectId - Project ID
 * @param {object} taskData - { title, description, assignee, dueDate, effort, estimatedTime }
 * @returns {Promise} Created task
 */
export const createTask = async (projectId, taskData) => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return response.data;
};

/**
 * Update a task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {object} updates - Fields to update
 * @returns {Promise} Updated task
 */
export const updateTask = async (projectId, taskId, updates) => {
  const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, updates);
  return response.data;
};

/**
 * Mark task as complete
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @returns {Promise} { task, xpAwarded }
 */
export const completeTask = async (projectId, taskId) => {
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/complete`);
  return response.data;
};

/**
 * Delete a task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @returns {Promise}
 */
export const deleteTask = async (projectId, taskId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
};

// ============================================
// SHIPS
// ============================================

/**
 * Get all ships for a project
 * @param {string} projectId - Project ID
 * @returns {Promise} Array of ships
 */
export const getShips = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/ships`);
  return response.data;
};

/**
 * Create a ship (log accomplishment)
 * @param {string} projectId - Project ID
 * @param {object} shipData - { description, relatedTask }
 * @returns {Promise} { ship, xpAwarded, streak }
 */
export const shipProject = async (projectId, shipData) => {
  const response = await api.post(`/projects/${projectId}/ships`, shipData);
  return response.data;
};

/**
 * Delete a ship
 * @param {string} projectId - Project ID
 * @param {string} shipId - Ship ID
 * @returns {Promise}
 */
export const deleteShip = async (projectId, shipId) => {
  const response = await api.delete(`/projects/${projectId}/ships/${shipId}`);
  return response.data;
};
