// src/hooks/useMilestones.js
// ═══════════════════════════════════════════════════════════════════════════════
// Milestones Hook - React Query wrapper for milestone operations
// Matches backend endpoint: GET /milestones?projectId=xxx
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

/* ─────────────────────────────────────────────────────────────────────────
   API HELPERS - Match your existing backend structure
───────────────────────────────────────────────────────────────────────── */

/**
 * Fetch milestones for a project
 * Backend: GET /milestones?projectId=xxx
 */
const fetchMilestones = async (projectId, options = {}) => {
  if (!projectId) {
    console.warn('[useMilestones] No projectId provided');
    return [];
  }

  try {
    const params = new URLSearchParams({ projectId });
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await client.get(`/milestones?${params.toString()}`);
    
    // Handle response shape: { success: true, data: [...] }
    const data = response?.data;
    
    if (data?.success && Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.milestones)) {
      return data.milestones;
    }
    
    console.warn('[useMilestones] Unexpected response shape:', data);
    return [];
  } catch (error) {
    console.error('[useMilestones] fetchMilestones failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Create a new milestone
 * Backend: POST /milestones
 */
const createMilestone = async ({ projectId, ...data }) => {
  const response = await client.post('/milestones', {
    projectId,
    ...data,
  });
  return response?.data?.data || response?.data;
};

/**
 * Update a milestone
 * Backend: PUT /milestones/:id
 */
const updateMilestone = async ({ milestoneId, ...data }) => {
  const response = await client.put(`/milestones/${milestoneId}`, data);
  return response?.data?.data || response?.data;
};

/**
 * Delete a milestone
 * Backend: DELETE /milestones/:id
 */
const deleteMilestone = async (milestoneId) => {
  await client.delete(`/milestones/${milestoneId}`);
};

/**
 * Link a task to a milestone
 * Backend: POST /milestones/:id/tasks
 */
const linkTaskToMilestone = async ({ milestoneId, taskId }) => {
  const response = await client.post(`/milestones/${milestoneId}/tasks`, { taskId });
  return response?.data?.data || response?.data;
};

/**
 * Unlink a task from a milestone
 * Backend: DELETE /milestones/:id/tasks/:taskId
 */
const unlinkTaskFromMilestone = async ({ milestoneId, taskId }) => {
  const response = await client.delete(`/milestones/${milestoneId}/tasks/${taskId}`);
  return response?.data?.data || response?.data;
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN HOOK
───────────────────────────────────────────────────────────────────────── */

/**
 * useMilestones - Main hook for milestone management
 * 
 * @param {string} projectId - Project ID to fetch milestones for
 * @param {object} options - Query options
 * @returns {object} Query result + mutation functions
 * 
 * @example
 * const { 
 *   milestones, 
 *   isLoading, 
 *   error,
 *   createMilestone,
 *   updateMilestone,
 *   deleteMilestone,
 * } = useMilestones(projectId);
 */
export function useMilestones(projectId, options = {}) {
  const queryClient = useQueryClient();

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY - Fetch milestones
  // ═══════════════════════════════════════════════════════════════════════════
  const query = useQuery({
    queryKey: ['milestones', projectId, options],
    queryFn: () => fetchMilestones(projectId, options),
    enabled: Boolean(projectId),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const createMutation = useMutation({
    mutationFn: (data) => createMilestone({ projectId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
    onError: (error) => {
      console.error('[useMilestones] Create failed:', error?.response?.data || error?.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ milestoneId, ...data }) => updateMilestone({ milestoneId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
    onError: (error) => {
      console.error('[useMilestones] Update failed:', error?.response?.data || error?.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
    onError: (error) => {
      console.error('[useMilestones] Delete failed:', error?.response?.data || error?.message);
    },
  });

  const linkTaskMutation = useMutation({
    mutationFn: linkTaskToMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });

  const unlinkTaskMutation = useMutation({
    mutationFn: unlinkTaskFromMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const milestones = query.data || [];
  
  const stats = {
    total: milestones.length,
    planned: milestones.filter(m => m.status === 'planned').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
    completed: milestones.filter(m => m.status === 'completed').length,
    atRisk: milestones.filter(m => m.status === 'at_risk').length,
  };

  const upcoming = milestones
    .filter(m => m.status !== 'completed')
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
    .slice(0, 5);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Query state
    milestones,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,

    // Computed
    stats,
    upcoming,

    // Mutations
    createMilestone: createMutation.mutateAsync,
    updateMilestone: updateMutation.mutateAsync,
    deleteMilestone: deleteMutation.mutateAsync,
    linkTask: linkTaskMutation.mutateAsync,
    unlinkTask: unlinkTaskMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   SINGLE MILESTONE HOOK
───────────────────────────────────────────────────────────────────────── */

/**
 * useMilestone - Fetch a single milestone by ID
 */
export function useMilestone(milestoneId) {
  return useQuery({
    queryKey: ['milestone', milestoneId],
    queryFn: async () => {
      const response = await client.get(`/milestones/${milestoneId}`);
      return response?.data?.data || response?.data;
    },
    enabled: Boolean(milestoneId),
    staleTime: 30 * 1000,
  });
}

export default useMilestones;
