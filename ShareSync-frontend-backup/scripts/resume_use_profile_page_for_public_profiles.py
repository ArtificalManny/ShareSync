#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BRIDGE = ROOT / "src/pages/profile/PublicProfile.jsx"
PROFILE = ROOT / "src/pages/Profile.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[resume_use_profile_page_for_public_profiles] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path, source: str):
    backup_path = path.with_name(f"{path.name}.bak-resume-use-profile-page-{STAMP}")
    backup_path.write_text(source, encoding="utf-8")
    print(f"[resume_use_profile_page_for_public_profiles] backup created: {backup_path}")


def patch_bridge():
    if not BRIDGE.exists():
        fail(f"Missing bridge file: {BRIDGE}")

    source = BRIDGE.read_text(encoding="utf-8")
    original = source

    desired = '''// src/pages/profile/PublicProfile.jsx
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

    if source == desired:
        print("[resume_use_profile_page_for_public_profiles] bridge already correct")
        return False

    if "../public/PublicProfile.jsx" not in source and "../Profile.jsx" not in source:
        fail("Bridge file does not look like the expected PublicProfile bridge.")

    backup(BRIDGE, original)
    BRIDGE.write_text(desired, encoding="utf-8")
    print("[resume_use_profile_page_for_public_profiles] patched bridge")
    return True


def ensure_use_params_import(source: str) -> str:
    if "useParams" in source:
        return source

    old = 'import { useLocation } from "react-router-dom";'
    new = 'import { useLocation, useParams } from "react-router-dom";'

    if old in source:
        print("[resume_use_profile_page_for_public_profiles] added useParams to react-router-dom import")
        return source.replace(old, new, 1)

    old_multi = 'import { useLocation, useNavigate } from "react-router-dom";'
    new_multi = 'import { useLocation, useNavigate, useParams } from "react-router-dom";'

    if old_multi in source:
        print("[resume_use_profile_page_for_public_profiles] added useParams to react-router-dom import")
        return source.replace(old_multi, new_multi, 1)

    fail("Could not find react-router-dom import to add useParams.")


def ensure_route_username(source: str) -> str:
    if "const { username: routeUsername } = useParams();" in source:
        return source

    marker = "  const location = useLocation();"
    if marker not in source:
        fail("Could not find const location = useLocation(); insertion point.")

    replacement = marker + "\n  const { username: routeUsername } = useParams();"
    print("[resume_use_profile_page_for_public_profiles] added routeUsername from useParams")
    return source.replace(marker, replacement, 1)


def ensure_public_route_logic(source: str) -> str:
    new_block = '''  const isPublicRoute = useMemo(() => {
    const path = location.pathname || "";

    return Boolean(routeUsername) && (
      path.startsWith("/profile/") ||
      path.startsWith("/u/")
    );
  }, [routeUsername, location.pathname]);'''

    if 'path.startsWith("/profile/")' in source and 'path.startsWith("/u/")' in source:
        return source

    old_block = '''  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && location.pathname.startsWith("/u/"),
    [routeUsername, location.pathname]
  );'''

    if old_block in source:
        print("[resume_use_profile_page_for_public_profiles] replaced old /u-only public route logic")
        return source.replace(old_block, new_block, 1)

    pattern = r"  const isPublicRoute = useMemo\([\s\S]*?\n  \);"
    matches = list(re.finditer(pattern, source))

    if len(matches) == 1 and "isPublicRoute" in matches[0].group(0):
        print("[resume_use_profile_page_for_public_profiles] replaced existing isPublicRoute block")
        start, end = matches[0].span()
        return source[:start] + new_block + source[end:]

    insert_after = "  const { username: routeUsername } = useParams();"
    if insert_after not in source:
        fail("Cannot insert isPublicRoute because routeUsername line is missing.")

    print("[resume_use_profile_page_for_public_profiles] inserted new isPublicRoute block")
    return source.replace(insert_after, insert_after + "\n\n" + new_block, 1)


def ensure_public_user_loading(source: str) -> str:
    if "const rawPublicUser = await getPublicUser(routeUsername);" in source and "const publicPayload =" in source:
        return source

    new_block = '''      if (isPublicRoute) {
        const rawPublicUser = await getPublicUser(routeUsername);
        const publicPayload =
          rawPublicUser?.data?.data ||
          rawPublicUser?.data?.user ||
          rawPublicUser?.data ||
          rawPublicUser?.user ||
          rawPublicUser;

        setPublicUser(publicPayload || null);
      } else {'''

    old_block = '''      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {'''

    if old_block in source:
        print("[resume_use_profile_page_for_public_profiles] replaced simple public user loader")
        return source.replace(old_block, new_block, 1)

    pattern = r"      if \(isPublicRoute\) \{\n[\s\S]*?setPublicUser\([\s\S]*?\);\n      \} else \{"
    matches = list(re.finditer(pattern, source))

    if len(matches) == 1:
        print("[resume_use_profile_page_for_public_profiles] replaced existing public user loader")
        start, end = matches[0].span()
        return source[:start] + new_block + source[end:]

    fail("Could not find public user loading block inside load().")


def ensure_export_owner_only(source: str) -> str:
    if "Export Button - owner-only" in source:
        return source

    old_block = '''        {/* Export Button */}
        <div className="col-span-12 flex justify-center pt-8">
          <button 
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 group"
            style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Export Profile Data</span>
          </button>
        </div>'''

    new_block = '''        {/* Export Button - owner-only */}
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

    if old_block in source:
        print("[resume_use_profile_page_for_public_profiles] made Export Profile Data owner-only")
        return source.replace(old_block, new_block, 1)

    print("[resume_use_profile_page_for_public_profiles] export block not found exactly; skipped owner-only export patch")
    return source


def patch_profile():
    if not PROFILE.exists():
        fail(f"Missing Profile.jsx: {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Profile()",
        "const location = useLocation();",
        "const user = isPublicRoute ? publicUser : me;",
        "const isOwnProfile = !isPublicRoute;",
        "getPublicUser",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Profile.jsx missing required structure marker: {marker}")

    source = ensure_use_params_import(source)
    source = ensure_route_username(source)
    source = ensure_public_route_logic(source)
    source = ensure_public_user_loading(source)
    source = ensure_export_owner_only(source)

    required_after = [
        "useParams",
        "const { username: routeUsername } = useParams();",
        'path.startsWith("/profile/")',
        'path.startsWith("/u/")',
        "const rawPublicUser = await getPublicUser(routeUsername);",
        "const publicPayload =",
        "setPublicUser(publicPayload || null);",
        "const user = isPublicRoute ? publicUser : me;",
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
        print("[resume_use_profile_page_for_public_profiles] Profile.jsx no changes needed")
        return False

    backup(PROFILE, original)
    PROFILE.write_text(source, encoding="utf-8")
    print("[resume_use_profile_page_for_public_profiles] patched Profile.jsx")
    return True


def main():
    print("[resume_use_profile_page_for_public_profiles] starting")

    bridge_changed = patch_bridge()
    profile_changed = patch_profile()

    if not bridge_changed and not profile_changed:
        print("[resume_use_profile_page_for_public_profiles] no changes needed")

    print("")
    print("[resume_use_profile_page_for_public_profiles] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"useParams|routeUsername|isPublicRoute|startsWith\\(\\\"/profile/\\\"\\)|rawPublicUser|publicPayload|Export Button|isOwnProfile|PUBLIC PROFILE ROUTE BRIDGE|import Profile\" src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx -C 8")
    print("  git diff -- src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx")


if __name__ == "__main__":
    main()
