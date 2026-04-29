#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BRIDGE = ROOT / "src/pages/profile/PublicProfile.jsx"
PROFILE = ROOT / "src/pages/Profile.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[use_profile_page_for_public_profiles] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path, source: str):
    backup_path = path.with_name(f"{path.name}.bak-use-profile-page-{STAMP}")
    backup_path.write_text(source, encoding="utf-8")
    print(f"[use_profile_page_for_public_profiles] backup created: {backup_path}")


def patch_bridge():
    print("[use_profile_page_for_public_profiles] patching src/pages/profile/PublicProfile.jsx")

    if not BRIDGE.exists():
        fail(f"Missing bridge file: {BRIDGE}")

    source = BRIDGE.read_text(encoding="utf-8")
    original = source

    required = [
        "PUBLIC PROFILE ROUTE BRIDGE",
        'import PublicProfile from "../public/PublicProfile.jsx";',
        "export default PublicProfile;",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Bridge file missing expected marker before patch: {marker}")

    new_content = '''// src/pages/profile/PublicProfile.jsx
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
// ═══════════════════════════════════════════════════════════════════════════════

import Profile from "../Profile.jsx";

export default Profile;
'''

    required_after = [
        'import Profile from "../Profile.jsx";',
        "export default Profile;",
        "/profile/:username",
        "read-only",
    ]

    for marker in required_after:
        if marker not in new_content:
            fail(f"Internal bridge safety check failed. Missing: {marker}")

    if source == new_content:
        print("[use_profile_page_for_public_profiles] bridge already patched")
        return

    backup(BRIDGE, original)
    BRIDGE.write_text(new_content, encoding="utf-8")
    print("[use_profile_page_for_public_profiles] patched bridge")


def patch_profile():
    print("[use_profile_page_for_public_profiles] patching src/pages/Profile.jsx")

    if not PROFILE.exists():
        fail(f"Missing profile file: {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Profile() {",
        "const { username: routeUsername } = useParams();",
        "const location = useLocation();",
        "const isPublicRoute = useMemo(",
        '() => Boolean(routeUsername) && location.pathname.startsWith("/u/"),',
        "const u = await getPublicUser(routeUsername);",
        "setPublicUser(u);",
        "const isOwnProfile = !isPublicRoute;",
        "{/* Export Button */}",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Profile.jsx missing expected marker before patch: {marker}")

    # 1) Make /profile/:username a public-read route, not just /u/:username.
    old_public_route = '''  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && location.pathname.startsWith("/u/"),
    [routeUsername, location.pathname]
  );'''

    new_public_route = '''  const isPublicRoute = useMemo(() => {
    const path = location.pathname || "";

    return Boolean(routeUsername) && (
      path.startsWith("/profile/") ||
      path.startsWith("/u/")
    );
  }, [routeUsername, location.pathname]);'''

    if source.count(old_public_route) != 1:
        fail("Could not find exact isPublicRoute block.")

    source = source.replace(old_public_route, new_public_route, 1)
    print("[use_profile_page_for_public_profiles] updated isPublicRoute for /profile/:username")

    # 2) Make public profile loading resilient to wrapped API responses.
    old_public_load = '''      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {'''

    new_public_load = '''      if (isPublicRoute) {
        const rawPublicUser = await getPublicUser(routeUsername);
        const publicPayload =
          rawPublicUser?.data?.data ||
          rawPublicUser?.data?.user ||
          rawPublicUser?.data ||
          rawPublicUser?.user ||
          rawPublicUser;

        setPublicUser(publicPayload || null);
      } else {'''

    if source.count(old_public_load) != 1:
        fail("Could not find exact public load block.")

    source = source.replace(old_public_load, new_public_load, 1)
    print("[use_profile_page_for_public_profiles] hardened public user payload extraction")

    # 3) Hide owner-only export button on public-read profiles.
    old_export_block = '''        {/* Export Button */}
        <div className="col-span-12 flex justify-center pt-8">
          <button 
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 group"
            style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Export Profile Data</span>
          </button>
        </div>'''

    new_export_block = '''        {/* Export Button - owner-only */}
        {isOwnProfile && (
          <div className="col-span-12 flex justify-center pt-8">
            <button 
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 group"
              style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-sm">Export Profile Data</span>
            </button>
          </div>
        )}'''

    if source.count(old_export_block) != 1:
      fail("Could not find exact Export Profile Data block.")

    source = source.replace(old_export_block, new_export_block, 1)
    print("[use_profile_page_for_public_profiles] made Export Profile Data owner-only")

    required_after = [
        'path.startsWith("/profile/")',
        'path.startsWith("/u/")',
        "const rawPublicUser = await getPublicUser(routeUsername);",
        "const publicPayload =",
        "setPublicUser(publicPayload || null);",
        "{isOwnProfile && (",
        "Export Button - owner-only",
        "const isOwnProfile = !isPublicRoute;",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Profile.jsx post-edit safety check failed. Missing: {marker}")

    forbidden_after = [
        '() => Boolean(routeUsername) && location.pathname.startsWith("/u/"),',
        "setPublicUser(u);",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Profile.jsx post-edit safety check failed. Forbidden marker still exists: {marker}")

    if source == original:
        print("[use_profile_page_for_public_profiles] Profile.jsx no changes needed")
        return

    backup(PROFILE, original)
    PROFILE.write_text(source, encoding="utf-8")
    print("[use_profile_page_for_public_profiles] patched Profile.jsx")


def main():
    print("[use_profile_page_for_public_profiles] starting")
    patch_bridge()
    patch_profile()

    print("")
    print("[use_profile_page_for_public_profiles] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"PUBLIC PROFILE ROUTE BRIDGE|import Profile|export default Profile|isPublicRoute|startsWith\\(\\\"/profile/\\\"\\)|rawPublicUser|publicPayload|Export Button|isOwnProfile\" src/pages/profile/PublicProfile.jsx src/pages/Profile.jsx -C 8")
    print("  git diff -- src/pages/profile/PublicProfile.jsx src/pages/Profile.jsx")


if __name__ == "__main__":
    main()
