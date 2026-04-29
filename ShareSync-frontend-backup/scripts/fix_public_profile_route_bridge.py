#!/usr/bin/env python3
from pathlib import Path
import re
import shutil
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"
PUBLIC_PROFILE = ROOT / "src/pages/profile/PublicProfile.jsx"

BACKUP_SUFFIX = ".bak-public-profile-route-bridge"


def fail(message: str) -> None:
    print(f"\n[fix_public_profile_route_bridge] ERROR: {message}")
    sys.exit(1)


def backup(path: Path) -> None:
    backup_path = path.with_name(path.name + BACKUP_SUFFIX)
    if not backup_path.exists():
        shutil.copy2(path, backup_path)
        print(f"[fix_public_profile_route_bridge] backup created: {backup_path}")
    else:
        print(f"[fix_public_profile_route_bridge] backup already exists: {backup_path}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0:
        fail(f"Could not find expected block for: {label}")
    if count > 1:
        fail(f"Found expected block more than once for: {label}")
    return text.replace(old, new, 1)


def main() -> None:
    print("[fix_public_profile_route_bridge] starting")

    if not PROFILE.exists():
        fail(f"Missing file: {PROFILE}")

    if not PUBLIC_PROFILE.exists():
        fail(f"Missing file: {PUBLIC_PROFILE}")

    backup(PROFILE)
    backup(PUBLIC_PROFILE)

    profile_text = PROFILE.read_text(encoding="utf-8")

    # ---------------------------------------------------------------------
    # 1. Make /profile/:username behave as a public profile route.
    #
    # Current bug:
    #   /profile/realmannyrivas has routeUsername, but pathname does not
    #   start with /u/, so Profile.jsx treats it as the signed-in user's page.
    #
    # Safe fix:
    #   Keep /u/:username support.
    #   Add /profile/:username support.
    #   Keep /profile without username as the private editable profile.
    # ---------------------------------------------------------------------
    old_public_route_block = '''  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && location.pathname.startsWith("/u/"),
    [routeUsername, location.pathname]
  );'''

    new_public_route_block = '''  const isPublicRoute = useMemo(
    () =>
      Boolean(routeUsername) &&
      (location.pathname.startsWith("/u/") ||
        location.pathname.startsWith("/profile/")),
    [routeUsername, location.pathname]
  );'''

    if old_public_route_block in profile_text:
        profile_text = replace_once(
            profile_text,
            old_public_route_block,
            new_public_route_block,
            "isPublicRoute /profile/:username support",
        )
        print("[fix_public_profile_route_bridge] patched isPublicRoute")
    elif new_public_route_block in profile_text:
        print("[fix_public_profile_route_bridge] isPublicRoute already patched")
    else:
        fail("Profile.jsx isPublicRoute block did not match the expected current or patched shape")

    # ---------------------------------------------------------------------
    # 2. Normalize getPublicUser() output.
    #
    # This avoids a fragile assumption about whether getPublicUser returns:
    #   user
    #   { user }
    #   { data }
    #   { data: { user } }
    # ---------------------------------------------------------------------
    old_public_user_block = '''      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {'''

    new_public_user_block = '''      if (isPublicRoute) {
        const rawPublicUser = await getPublicUser(routeUsername);
        const u =
          rawPublicUser?.user && typeof rawPublicUser.user === "object"
            ? rawPublicUser.user
            : rawPublicUser?.data?.user && typeof rawPublicUser.data.user === "object"
              ? rawPublicUser.data.user
              : rawPublicUser?.data && typeof rawPublicUser.data === "object" && !Array.isArray(rawPublicUser.data)
                ? rawPublicUser.data
                : rawPublicUser;

        setPublicUser(u || null);
      } else {'''

    if old_public_user_block in profile_text:
        profile_text = replace_once(
            profile_text,
            old_public_user_block,
            new_public_user_block,
            "public user response normalization",
        )
        print("[fix_public_profile_route_bridge] patched public user normalization")
    elif "const rawPublicUser = await getPublicUser(routeUsername);" in profile_text:
        print("[fix_public_profile_route_bridge] public user normalization already present")
    else:
        fail("Could not find public getPublicUser() block")

    # ---------------------------------------------------------------------
    # 3. Prevent the logged-in user's local avatar override from leaking onto
    #    another person's public profile.
    #
    # Current logic always prefers localStorage avatar override/stored avatar.
    # That is correct for your own editable profile, but wrong for public users.
    # ---------------------------------------------------------------------
    old_display_url_block = '''  const displayUrl =
    previewUrl || localOverride || storedAvatar || backendAvatar || "/default-profile.png";'''

    new_display_url_block = '''  const displayUrl =
    previewUrl ||
    (isOwnProfile ? localOverride || storedAvatar : null) ||
    backendAvatar ||
    "/default-profile.png";'''

    if old_display_url_block in profile_text:
        profile_text = replace_once(
            profile_text,
            old_display_url_block,
            new_display_url_block,
            "public profile avatar isolation",
        )
        print("[fix_public_profile_route_bridge] patched avatar isolation")
    elif new_display_url_block in profile_text:
        print("[fix_public_profile_route_bridge] avatar isolation already patched")
    else:
        fail("Could not find ProfilePhotoEditor displayUrl block")

    # ---------------------------------------------------------------------
    # 4. Keep the bridge file explicit and boring.
    # ---------------------------------------------------------------------
    bridge_text = '''// src/pages/profile/PublicProfile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE ROUTE BRIDGE
//
// /profile/:username is mounted through App.jsx using this file.
// Route it through the main Profile.jsx page so public user profiles share the
// same visual language as the signed-in user's profile cockpit.
//
// Profile.jsx decides:
//   /profile           → current logged-in user, editable
//   /profile/:username → specific public user, read-only
//   /u/:username       → specific public user, read-only
// ═══════════════════════════════════════════════════════════════════════════════

import Profile from "../Profile.jsx";

export default Profile;
'''

    PUBLIC_PROFILE.write_text(bridge_text, encoding="utf-8")
    PROFILE.write_text(profile_text, encoding="utf-8")

    print("\n[fix_public_profile_route_bridge] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"isPublicRoute|rawPublicUser|isOwnProfile|displayUrl|PUBLIC PROFILE ROUTE BRIDGE\" src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx")


if __name__ == "__main__":
    main()
