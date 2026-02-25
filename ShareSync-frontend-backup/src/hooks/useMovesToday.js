// src/hooks/useMovesToday.js
import { useQuery } from '@tanstack/react-query';
import { getPriorityTasks } from '../api/tasks';

export function useMovesToday(limit = 3, projectId = null) {
  return useQuery({
    queryKey: ['movesToday', limit, projectId],
    queryFn: () => getPriorityTasks(limit, projectId),
    // Data is considered fresh for 2 minutes. After that, it will refetch in the background.
    staleTime: 1000 * 60 * 2, 
    // Always fetch fresh data if the user tabs away and comes back
    refetchOnWindowFocus: true,
  });
}
