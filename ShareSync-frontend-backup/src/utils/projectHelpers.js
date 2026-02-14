// src/utils/projectHelpers.js
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HELPERS
// Utilities for safely handling project IDs and navigation
// Handles both MongoDB _id and normalized id fields
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely extract project ID from a project object
 * Handles both MongoDB _id and normalized id fields
 * @param {Object} project - Project object
 * @returns {string|null} - Project ID or null if invalid
 */
export function getProjectId(project) {
  if (!project) return null;
  
  // Try _id first (MongoDB), then id (normalized)
  const id = project._id || project.id;
  
  // Validate it's a real ID
  if (!id || id === 'undefined' || id === 'null') {
    return null;
  }
  
  // Handle ObjectId objects (MongoDB)
  if (typeof id === 'object' && id.toString) {
    return id.toString();
  }
  
  return String(id);
}

/**
 * Check if a project has a valid ID
 * @param {Object} project - Project object
 * @returns {boolean}
 */
export function hasValidProjectId(project) {
  return getProjectId(project) !== null;
}

/**
 * Build project URL path
 * @param {Object|string} projectOrId - Project object or ID string
 * @returns {string|null} - URL path or null if invalid
 */
export function getProjectPath(projectOrId) {
  const id = typeof projectOrId === 'string' 
    ? projectOrId 
    : getProjectId(projectOrId);
  
  if (!id) return null;
  
  return `/projects/${id}`;
}

/**
 * Safe navigation to project
 * @param {Function} navigate - React Router navigate function
 * @param {Object} project - Project object
 * @param {Object} options - Navigation options
 * @returns {boolean} - Whether navigation was successful
 */
export function navigateToProject(navigate, project, options = {}) {
  const path = getProjectPath(project);
  
  if (!path) {
    console.error('[navigateToProject] Invalid project ID:', project);
    return false;
  }
  
  navigate(path, options);
  return true;
}

/**
 * Normalize project object to ensure id field exists
 * @param {Object} project - Raw project from API
 * @returns {Object} - Project with guaranteed id field
 */
export function normalizeProject(project) {
  if (!project) return null;
  
  const id = getProjectId(project);
  
  // Return null for invalid projects
  if (!id) {
    console.warn('[normalizeProject] Project has no valid ID:', project);
    return null;
  }
  
  return {
    ...project,
    id,        // Ensure id always exists
    _id: id,   // Ensure _id always exists
  };
}

/**
 * Normalize array of projects
 * @param {Array} projects - Array of raw projects
 * @returns {Array} - Array of normalized projects (invalid ones filtered out)
 */
export function normalizeProjects(projects) {
  if (!Array.isArray(projects)) return [];
  return projects.map(normalizeProject).filter(Boolean);
}

export default {
  getProjectId,
  hasValidProjectId,
  getProjectPath,
  navigateToProject,
  normalizeProject,
  normalizeProjects,
};
