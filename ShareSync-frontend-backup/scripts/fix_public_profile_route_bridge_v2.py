#!/usr/bin/env python3
from pathlib import Path
import re
import shutil
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"
PUBLIC_PROFILE = ROOT / "src/pages/profile/PublicProfile.jsx"

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str) -> None:
    print(f"\n[fix_public_profile_route_bridge_v2] ERROR: {message}")
    sys.exit(1)


def backup(path: Path) -> None:
    if not path.exists():
        fail(f"Missing file: {path}")

    backup_path = path.with_name(f"{path.name}.bak-public-profile-route-bridge-v2-{STAMP}")
    shutil.copy2(path, backup_path)
    print(f"[fix_public_profile_route_bridge_v2] backup created: {backup_path}")


def replace_between(text: str, start_marker: str, end_marker: str, replacement: str, label: str) -> str:
    start = text.find(start_marker)
    if start == -1:
        fail(f"Could not find start marker for {label}: {start_marker}")

    end = text.find(end_marker, start)
    if end == -1:
        fail(f"Could not find end marker for {label}: {end_marker}")

    return text[:start] + replacement + text[end:]


def patch_public_route_logic(text: str) -> str:
    replacement = '''  const isPublicRoute = useMemo(
    () =>
      Boolean(routeUsername) &&
      (location.pathname.startsWith("/profile/") ||
        location.pathname.startsWith("/u/")),
    [routeUsername, location.pathname]
  );

'''

    return replace_between(
        text=text,
        start_marker="  const isPublicRoute = useMemo(",
        end_marker="  const load = useCallback",
        replacement=replacement,
        label="isPublicRoute logic",
    )


def patch_public_user_normalization(text: str) -> str:
    old_pattern = re.compile(
        r'''      if \(isPublicRoute\) \{\s*
        const u = await getPublicUser\(routeUsername\);\s*
        setPublicUser\(u\);\s*
      \} else \{''',
        re.MULTILINE,
    )

    new_block = '''      if (isPublicRoute) {
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

    if old_pattern.search(text):
        text = old_pattern.sub(new_block, text, count=1)
        print("[fix_public_profile_route_bridge_v2] patched getPublicUser normalization")
        return text

    if "const rawPublicUser = await getPublicUser(routeUsername);" in text:
        print("[fix_public_profile_route_bridge_v2] getPublicUser normalization already present")
        return text

    fail("Could not find the simple getPublicUser(routeUsername) block to patch")


def patch_avatar_isolation(text: str) -> str:
    old_pattern = re.compile(
        r'''  const displayUrl =\s*
    previewUrl \|\| localOverride \|\| storedAvatar \|\| backendAvatar \|\| "/default-profile\.png";''',
        re.MULTILINE,
    )

    new_block = '''  const displayUrl =
    previewUrl ||
    (isOwnProfile ? localOverride || storedAvatar : null) ||
    backendAvatar ||
    "/default-profile.png";'''

    if old_pattern.search(text):
        text = old_pattern.sub(new_block, text, count=1)
        print("[fix_public_profile_route_bridge_v2] patched avatar isolation")
        return text

    if "(isOwnProfile ? localOverride || storedAvatar : null)" in text:
        print("[fix_public_profile_route_bridge_v2] avatar isolation already present")
        return text

    fail("Could not find ProfilePhotoEditor displayUrl block to patch")


def write_public_profile_bridge() -> None:
    bridge = '''// src/pages/profile/PublicProfile.jsx
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

    PUBLIC_PROFILE.write_text(bridge, encoding="utf-8")
    print("[fix_public_profile_route_bridge_v2] rewrote PublicProfile.jsx bridge")


def main() -> None:
    print("[fix_public_profile_route_bridge_v2] starting")

    backup(PROFILE)
    backup(PUBLIC_PROFILE)

    text = PROFILE.read_text(encoding="utf-8")

    text = patch_public_route_logic(text)
    print("[fix_public_profile_route_bridge_v2] patched isPublicRoute logic")

    text = patch_public_user_normalization(text)
    text = patch_avatar_isolation(text)

    PROFILE.write_text(text, encoding="utf-8")
    write_public_profile_bridge()

    print("\n[fix_public_profile_route_bridge_v2] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"isPublicRoute|rawPublicUser|isOwnProfile|displayUrl|PUBLIC PROFILE ROUTE BRIDGE\" src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx")


if __name__ == "__main__":
    main()
