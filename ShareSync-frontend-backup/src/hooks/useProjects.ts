// src/hooks/useProjects.ts
// ⭐ FIX: Added helper function re-exports for convenience
import { useProject, useProjectId, useHasValidProject } from "../context/ProjectContext";

// Re-export context hooks
export { useProject, useProjectId, useHasValidProject };

// Main export - same as before for backward compatibility
export const useProjects = () => {
  const ctx = useProject(); // Returns safe fallback if missing provider
  return ctx;
};

// Re-export helper functions for project ID handling
export { 
  getProjectId, 
  hasValidProjectId, 
  getProjectPath, 
  navigateToProject,
  normalizeProject,
  normalizeProjects,
} from '../utils/projectHelpers';

export default useProjects;
