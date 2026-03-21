// src/hooks/useFollow.js
// ═══════════════════════════════════════════════════════════════════════════════
// useFollow HOOK - Reusable follow/unfollow toggle
//
// Usage in any component:
//   const { following, loading, followersCount, toggle } = useFollow(projectId, false);
//
//   <button onClick={toggle} disabled={loading}>
//     {following ? 'Following' : 'Follow'}
//   </button>
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { followProject, unfollowProject } from '../api/follows';

/**
 * @param {string} projectId - The project to follow/unfollow
 * @param {boolean} initialFollowing - Whether already following (from bulk status check)
 * @param {number} initialCount - Initial followers count (optional)
 * @returns {{ following: boolean, loading: boolean, followersCount: number, toggle: () => Promise<void> }}
 */
export function useFollow(projectId, initialFollowing = false, initialCount = 0) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialCount);

  const toggle = useCallback(async () => {
    if (!projectId || loading) return;

    // Optimistic update — flip immediately for snappy UX
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowersCount((prev) => (wasFollowing ? Math.max(0, prev - 1) : prev + 1));
    setLoading(true);

    try {
      let result;
      if (wasFollowing) {
        result = await unfollowProject(projectId);
      } else {
        result = await followProject(projectId);
      }

      // Use server-confirmed values if available
      if (result?.success) {
        setFollowing(result.following);
        if (typeof result.followersCount === 'number') {
          setFollowersCount(result.followersCount);
        }
      } else {
        // Revert optimistic update on failure
        setFollowing(wasFollowing);
        setFollowersCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (err) {
      // Revert optimistic update on error
      console.error('[useFollow] toggle failed:', err);
      setFollowing(wasFollowing);
      setFollowersCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setLoading(false);
    }
  }, [projectId, following, loading]);

  return { following, loading, followersCount, toggle };
}
