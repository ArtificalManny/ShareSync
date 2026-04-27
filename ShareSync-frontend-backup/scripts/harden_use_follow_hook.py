#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/hooks/useFollow.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_use_follow_hook] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = """// src/hooks/useFollow.js
// ═══════════════════════════════════════════════════════════════════════════════
// useFollow HOOK - Reusable follow/unfollow toggle
//
// Usage in any component:
//   const { following, loading, followersCount, error, toggle } = useFollow(projectId, false);
//
//   <button onClick={toggle} disabled={loading}>
//     {following ? 'Following' : 'Follow'}
//   </button>
//
// Important product rule:
// - Following a project does NOT make the user a project member.
// - Following creates a spectator/subscriber relationship for public projects.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useMemo } from 'react';
import { followProject, unfollowProject } from '../api/follows';

function normalizeProjectId(projectId) {
  const id = String(projectId || '').trim();

  if (!id || id === 'undefined' || id === 'null') {
    return '';
  }

  return id;
}

/**
 * @param {string} projectId - The project to follow/unfollow
 * @param {boolean} initialFollowing - Whether already following (from bulk status check)
 * @param {number} initialCount - Initial followers count (optional)
 * @returns {{
 *   following: boolean,
 *   loading: boolean,
 *   followersCount: number,
 *   error: Error | null,
 *   toggle: () => Promise<void>,
 *   setFollowing: import('react').Dispatch<import('react').SetStateAction<boolean>>,
 *   setFollowersCount: import('react').Dispatch<import('react').SetStateAction<number>>
 * }}
 */
export function useFollow(projectId, initialFollowing = false, initialCount = 0) {
  const normalizedProjectId = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [following, setFollowing] = useState(Boolean(initialFollowing));
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(
    Number.isFinite(Number(initialCount)) ? Number(initialCount) : 0
  );
  const [error, setError] = useState(null);

  // Keep local state aligned when the parent receives async bulk follow status.
  useEffect(() => {
    setFollowing(Boolean(initialFollowing));
  }, [initialFollowing, normalizedProjectId]);

  useEffect(() => {
    const nextCount = Number.isFinite(Number(initialCount)) ? Number(initialCount) : 0;
    setFollowersCount(nextCount);
  }, [initialCount, normalizedProjectId]);

  const toggle = useCallback(async () => {
    if (!normalizedProjectId || loading) return;

    const wasFollowing = following;
    const nextFollowing = !wasFollowing;

    setError(null);
    setLoading(true);

    // Optimistic update — flip immediately for snappy UX.
    setFollowing(nextFollowing);
    setFollowersCount((prev) => (
      wasFollowing ? Math.max(0, Number(prev || 0) - 1) : Number(prev || 0) + 1
    ));

    try {
      const result = wasFollowing
        ? await unfollowProject(normalizedProjectId)
        : await followProject(normalizedProjectId);

      if (result?.success !== false) {
        setFollowing(Boolean(result?.following ?? nextFollowing));

        if (typeof result?.followersCount === 'number') {
          setFollowersCount(Math.max(0, result.followersCount));
        }

        return;
      }

      // Revert optimistic update on unsuccessful response.
      setFollowing(wasFollowing);
      setFollowersCount((prev) => (
        wasFollowing ? Number(prev || 0) + 1 : Math.max(0, Number(prev || 0) - 1)
      ));
      setError(new Error('Follow action was not accepted by the server.'));
    } catch (err) {
      // Revert optimistic update on error.
      console.error('[useFollow] toggle failed:', err);

      setFollowing(wasFollowing);
      setFollowersCount((prev) => (
        wasFollowing ? Number(prev || 0) + 1 : Math.max(0, Number(prev || 0) - 1)
      ));
      setError(err instanceof Error ? err : new Error('Follow action failed.'));
    } finally {
      setLoading(false);
    }
  }, [normalizedProjectId, following, loading]);

  return {
    following,
    loading,
    followersCount,
    error,
    toggle,
    setFollowing,
    setFollowersCount,
  };
}

export default useFollow;
"""


def main():
    print("[harden_use_follow_hook] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        "export function useFollow(projectId, initialFollowing = false, initialCount = 0)",
        "const [following, setFollowing] = useState(initialFollowing);",
        "const [loading, setLoading] = useState(false);",
        "const [followersCount, setFollowersCount] = useState(initialCount);",
        "const toggle = useCallback(async () => {",
        "followProject, unfollowProject",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected marker before patch: {marker}")

    required_after = [
        "import { useState, useCallback, useEffect, useMemo } from 'react';",
        "function normalizeProjectId(projectId)",
        "const normalizedProjectId = useMemo(() => normalizeProjectId(projectId), [projectId]);",
        "const [error, setError] = useState(null);",
        "useEffect(() => {",
        "setFollowing(Boolean(initialFollowing));",
        "setFollowersCount(nextCount);",
        "result?.success !== false",
        "return {",
        "error,",
        "setFollowing,",
        "setFollowersCount,",
        "export default useFollow;",
    ]

    for marker in required_after:
        if marker not in NEW_CONTENT:
            fail(f"Internal safety check failed. Missing marker in new content: {marker}")

    if original == NEW_CONTENT:
        print("[harden_use_follow_hook] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-harden-use-follow-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_use_follow_hook] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[harden_use_follow_hook] patched: {TARGET}")

    print("")
    print("[harden_use_follow_hook] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"normalizeProjectId|useMemo|useEffect|error|setError|setFollowing|setFollowersCount|export default useFollow\" src/hooks/useFollow.js -C 8")
    print("  git diff -- src/hooks/useFollow.js")


if __name__ == "__main__":
    main()
