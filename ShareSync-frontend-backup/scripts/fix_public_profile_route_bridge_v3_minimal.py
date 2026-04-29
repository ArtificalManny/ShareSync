#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"
PUBLIC_PROFILE = ROOT / "src/pages/profile/PublicProfile.jsx"

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str) -> None:
    print(f"\n[fix_public_profile_route_bridge_v3_minimal] ERROR: {message}")
    sys.exit(1)


def backup(path: Path) -> None:
    if not path.exists():
        fail(f"Missing file: {path}")

    backup_path = path.with_name(f"{path.name}.bak-public-profile-route-v3-{STAMP}")
    shutil.copy2(path, backup_path)
    print(f"[fix_public_profile_route_bridge_v3_minimal] backup created: {backup_path}")


def replace_is_public_route(text: str) -> str:
    start_marker = "  const isPublicRoute = useMemo("
    end_marker = "  const load = useCallback"

    start = text.find(start_marker)
    if start == -1:
        fail("Could not find start marker: const isPublicRoute = useMemo(")

    end = text.find(end_marker, start)
    if end == -1:
        fail("Could not find end marker: const load = useCallback")

    replacement = '''  const isPublicRoute = useMemo(
    () =>
      Boolean(routeUsername) &&
      (location.pathname.startsWith("/profile/") ||
        location.pathname.startsWith("/u/")),
    [routeUsername, location.pathname]
  );

'''

    return text[:start] + replacement + text[end:]


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
    print("[fix_public_profile_route_bridge_v3_minimal] PublicProfile.jsx bridge confirmed")


def main() -> None:
    print("[fix_public_profile_route_bridge_v3_minimal] starting")

    backup(PROFILE)
    backup(PUBLIC_PROFILE)

    profile_text = PROFILE.read_text(encoding="utf-8")
    profile_text = replace_is_public_route(profile_text)

    PROFILE.write_text(profile_text, encoding="utf-8")
    write_public_profile_bridge()

    print("\n[fix_public_profile_route_bridge_v3_minimal] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"isPublicRoute|startsWith\\(\\\"/profile/\\\"\\)|startsWith\\(\\\"/u/\\\"\\)|PUBLIC PROFILE ROUTE BRIDGE\" src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx")


if __name__ == "__main__":
    main()
