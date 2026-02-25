// src/hooks/useIntelligence.js
import { useQuery } from '@tanstack/react-query';
import { getIntelligence } from '../api/analytics';

export function useIntelligence(projectId = null) {
  return useQuery({
    queryKey: ['intelligence', projectId],
    queryFn: () => getIntelligence(projectId),
    // Intelligence changes dynamically with co-workers logging on/off
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
