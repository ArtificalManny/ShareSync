#!/usr/bin/env python3
"""
Add public stats fetching to Profile.jsx for /profile/:username route.

Currently, the if (isPublicRoute) branch fetches the user via getPublicUser/
getUserById but does NOT fetch their gamification stats. This means the
Impact Metrics card on public profiles always shows 0 deployments, 0d
momentum, etc.

Fix: After fetching the public user, also fetch their stats from the
existing backend endpoint GET /api/gamification/stats/:userId (which is
already public-by-userId), and merge those values into publicUser so the
existing JSX renders real numbers.

Scope: Frontend-only. One file. One anchored str.replace. Automatic backup.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/pages/Profile.jsx")

src = PATH.read_text(encoding="utf-8")

# Exact anchor — copied verbatim from the sed output of lines 942-968
# (the if (isPublicRoute) branch, ending with the catch block for getMe())
OLD = """      if (isPublicRoute) {
        // ⭐ FIX: If we have an ID, grab that exact user from the database
        const u = (id || routeUserId) ? await getUserById(id || routeUserId) : await getPublicUser(routeUsername);
        setPublicUser(u);

        // We still need to fetch "Me" silently to check if we happen to be viewing our own profile
        try {
          const rawResponse = await getMe();
          let userData = null;
          if (rawResponse?.user && typeof rawResponse.user === 'object') userData = rawResponse.user;
          else if (rawResponse?.data?.user && typeof rawResponse.data.user === 'object') userData = rawResponse.data.user;
          else if (rawResponse?.data && typeof rawResponse.data === 'object' && !Array.isArray(rawResponse.data)) userData = rawResponse.data;
          else if (rawResponse && typeof rawResponse === 'object' && (rawResponse._id || rawResponse.id || rawResponse.email)) userData = rawResponse;
          else userData = rawResponse || {};

          const storedUser = readStoredUser();
          const storedOverride = readAvatarOverride();
          const storedAvatar = storedOverride || storedUser?.avatarUrl || storedUser?.profilePicture || null;
          const merged = storedAvatar ? { ...userData, avatarUrl: storedAvatar, profilePicture: storedAvatar } : userData;
          setMe(merged);
        } catch (e) {
          // Ignore error silently. It just means edit privileges will default to false.
        }

      } else if (isViewingOtherUser) {"""

# Replacement — same logic, plus a stats fetch for the public user
NEW = """      if (isPublicRoute) {
        // ⭐ FIX: If we have an ID, grab that exact user from the database
        const u = (id || routeUserId) ? await getUserById(id || routeUserId) : await getPublicUser(routeUsername);
        setPublicUser(u);

        // ⭐ Fetch public gamification stats for the viewed user so Impact
        // Metrics and Operational Trust panels show real values instead of 0.
        // Uses GET /api/gamification/stats/:userId (existing public-by-userId
        // endpoint). Owner-only panels (Skill Profile, Growth Suggestions,
        // Trends, Behavioral Analysis) remain gated behind isOwnProfile in JSX.
        try {
          const publicUserId = u?._id || u?.id;
          if (publicUserId) {
            const statsRes = await client.get(`/gamification/stats/${publicUserId}`);
            const stats = statsRes.data?.data || statsRes.data;
            if (stats) {
              setPublicUser(prev => ({
                ...prev,
                totalShips: stats.totalShips ?? stats.ships ?? prev?.totalShips ?? 0,
                currentStreak: stats.streakDays ?? prev?.currentStreak ?? 0,
                weeklyShips: stats.weeklyShips ?? prev?.weeklyShips ?? 0,
                completionRate: stats.completionRate ?? stats.focus ?? prev?.completionRate ?? 0,
                efficiency: stats.efficiency ?? prev?.efficiency ?? 0,
              }));
            }
          }
        } catch (err) {
          console.warn("[Profile] public stats load failed", err?.message || err);
        }

        // We still need to fetch "Me" silently to check if we happen to be viewing our own profile
        try {
          const rawResponse = await getMe();
          let userData = null;
          if (rawResponse?.user && typeof rawResponse.user === 'object') userData = rawResponse.user;
          else if (rawResponse?.data?.user && typeof rawResponse.data.user === 'object') userData = rawResponse.data.user;
          else if (rawResponse?.data && typeof rawResponse.data === 'object' && !Array.isArray(rawResponse.data)) userData = rawResponse.data;
          else if (rawResponse && typeof rawResponse === 'object' && (rawResponse._id || rawResponse.id || rawResponse.email)) userData = rawResponse;
          else userData = rawResponse || {};

          const storedUser = readStoredUser();
          const storedOverride = readAvatarOverride();
          const storedAvatar = storedOverride || storedUser?.avatarUrl || storedUser?.profilePicture || null;
          const merged = storedAvatar ? { ...userData, avatarUrl: storedAvatar, profilePicture: storedAvatar } : userData;
          setMe(merged);
        } catch (e) {
          // Ignore error silently. It just means edit privileges will default to false.
        }

      } else if (isViewingOtherUser) {"""

# Safety check 1: anchor must appear EXACTLY ONCE
occurrences = src.count(OLD)
if occurrences != 1:
    print(f"ERROR: anchor found {occurrences} times. Expected exactly 1.", file=sys.stderr)
    print("File NOT modified. The if (isPublicRoute) block may have been edited.", file=sys.stderr)
    print("Re-run: sed -n '940,970p' src/pages/Profile.jsx to inspect.", file=sys.stderr)
    sys.exit(1)

# Backup before mutation
backup = PATH.with_suffix(PATH.suffix + ".bak.before-public-stats")
backup.write_text(src, encoding="utf-8")
print(f"Backup written to: {backup}")

new_src = src.replace(OLD, NEW, 1)

# Safety check 2: verify our replacement landed correctly
expected_marker = "Fetch public gamification stats for the viewed user"
if new_src.count(expected_marker) != 1:
    print("ERROR: post-edit verification failed. Marker not found.", file=sys.stderr)
    print("File NOT modified.", file=sys.stderr)
    sys.exit(1)

# Safety check 3: confirm exactly one new client.get call for gamification stats
if new_src.count("/gamification/stats/${publicUserId}") != 1:
    print("ERROR: gamification stats call count wrong.", file=sys.stderr)
    sys.exit(1)

# Safety check 4: confirm we didn't accidentally duplicate the if(isPublicRoute) block
if new_src.count("if (isPublicRoute) {\n        // ⭐ FIX: If we have an ID") != 1:
    print(f"ERROR: if(isPublicRoute) block appears wrong number of times.", file=sys.stderr)
    sys.exit(1)

PATH.write_text(new_src, encoding="utf-8")
print("✓ Public stats fetching added successfully.")
print()
print("Behavior change:")
print("  - /profile (own profile): UNCHANGED — fetches /users/me/stats as before")
print("  - /profile/:username (public): now ALSO fetches /gamification/stats/:userId")
print("    so Impact Metrics shows real Deployments/Momentum/Streak values")
print()
print("Owner-only panels (Skill Profile, Growth Suggestions, Trends, Behavioral")
print("Analysis, Profile Strength, Edit Profile button) remain hidden on public")
print("profiles via existing isOwnProfile gates in JSX.")
print()
print("Recovery if needed:")
print(f"  cp {backup} {PATH}")
