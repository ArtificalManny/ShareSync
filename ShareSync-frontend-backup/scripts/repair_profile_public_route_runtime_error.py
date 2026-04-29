#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"
APP = ROOT / "src/App.jsx"
BRIDGE = ROOT / "src/pages/profile/PublicProfile.jsx"

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str) -> None:
    print(f"\n[repair_profile_public_route_runtime_error] ERROR: {message}")
    sys.exit(1)


def backup(path: Path) -> None:
    if not path.exists():
        fail(f"Missing file: {path}")

    backup_path = path.with_name(f"{path.name}.bak-profile-public-route-repair-{STAMP}")
    shutil.copy2(path, backup_path)
    print(f"[repair_profile_public_route_runtime_error] backup created: {backup_path}")


def patch_profile_is_viewing_other_user() -> None:
    text = PROFILE.read_text(encoding="utf-8")

    if "const isViewingOtherUser =" in text:
        print("[repair_profile_public_route_runtime_error] isViewingOtherUser already defined")
        PROFILE.write_text(text, encoding="utf-8")
        return

    marker = '''  const isPublicRoute = useMemo(
    () =>
      Boolean(routeUsername) &&
      (location.pathname.startsWith("/profile/") ||
        location.pathname.startsWith("/u/")),
    [routeUsername, location.pathname]
  );

'''

    if marker not in text:
        fail("Could not find the expected isPublicRoute block in Profile.jsx")

    replacement = marker + '''  const isViewingOtherUser = Boolean(routeUsername) && isPublicRoute;

'''

    text = text.replace(marker, replacement, 1)

    PROFILE.write_text(text, encoding="utf-8")
    print("[repair_profile_public_route_runtime_error] added isViewingOtherUser definition to Profile.jsx")


def patch_app_public_profile_import() -> None:
    text = APP.read_text(encoding="utf-8")

    old_import = 'const PublicProfile = lazy(() => import("./pages/public/PublicProfile.jsx"));'
    new_import = 'const PublicProfile = lazy(() => import("./pages/profile/PublicProfile.jsx"));'

    if new_import in text:
        print("[repair_profile_public_route_runtime_error] App.jsx already imports the bridge PublicProfile")
        APP.write_text(text, encoding="utf-8")
        return

    if old_import not in text:
        fail("Could not find the old PublicProfile import in App.jsx")

    text = text.replace(old_import, new_import, 1)

    APP.write_text(text, encoding="utf-8")
    print("[repair_profile_public_route_runtime_error] App.jsx now routes /profile/:username through the bridge")


def confirm_bridge_file() -> None:
    if not BRIDGE.exists():
        fail(f"Missing bridge file: {BRIDGE}")

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

    BRIDGE.write_text(bridge_text, encoding="utf-8")
    print("[repair_profile_public_route_runtime_error] bridge file confirmed")


def main() -> None:
    print("[repair_profile_public_route_runtime_error] starting")

    backup(PROFILE)
    backup(APP)
    backup(BRIDGE)

    patch_profile_is_viewing_other_user()
    patch_app_public_profile_import()
    confirm_bridge_file()

    print("\n[repair_profile_public_route_runtime_error] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"isViewingOtherUser|pages/profile/PublicProfile|pages/public/PublicProfile|path=\\\"/profile/:username\\\"\" src/pages/Profile.jsx src/App.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx src/App.jsx")


if __name__ == "__main__":
    main()
