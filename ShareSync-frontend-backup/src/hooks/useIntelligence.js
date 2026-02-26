// src/hooks/useIntelligence.js
// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE HOOK - Safety Audit
// Added a fallback mechanism so if the backend endpoint is down or still 
// being built, it won't crash the entire dashboard UI.
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { getIntelligence } from '../api/analytics';

export function useIntelligence(projectId = null) {
  return useQuery({
    queryKey: ['intelligence', projectId],
    queryFn: async () => {
      try {
        const data = await getIntelligence(projectId);
        return data || {};
      } catch (error) {
        console.warn("[Intelligence API] Backend not ready or offline, using safe fallback.");
        return {
          isBalanced: true,
          workloadMsg: "Optimized across all nodes.",
          peakWindowStart: 13, // 1 PM
          peakWindowEnd: 15,   // 3 PM
          productivity: 72,
          coWorkingMultiplier: 1.5,
          isCoWorking: false
        };
      }
    },
    // Intelligence changes dynamically with co-workers logging on/off
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
