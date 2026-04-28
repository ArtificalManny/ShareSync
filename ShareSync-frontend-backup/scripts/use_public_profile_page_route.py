#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
APP = ROOT / "src/App.jsx"
PUBLIC_PROFILE = ROOT / "src/pages/public/PublicProfile.jsx"
OLD_PROFILE = ROOT / "src/pages/profile/PublicProfile.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[use_public_profile_page_route] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[use_public_profile_page_route] starting")

    if not APP.exists():
        fail(f"Missing file: {APP}")

    if not PUBLIC_PROFILE.exists():
        fail(f"Missing expected public profile file: {PUBLIC_PROFILE}")

    source = APP.read_text(encoding="utf-8")
    original = source

    old_import = 'const PublicProfile = lazy(() => import("./pages/profile/PublicProfile"));'
    new_import = 'const PublicProfile = lazy(() => import("./pages/public/PublicProfile.jsx"));'

    required_markers = [
        old_import,
        '<Route path="/profile/:username" element={<PublicProfile />} />',
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    if new_import in source:
        print("[use_public_profile_page_route] App.jsx already uses src/pages/public/PublicProfile.jsx")
        return

    if source.count(old_import) != 1:
        fail("Expected exactly one old PublicProfile import in App.jsx")

    backup = APP.with_name(f"{APP.name}.bak-public-profile-route-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[use_public_profile_page_route] backup created: {backup}")

    source = source.replace(old_import, new_import, 1)

    required_after = [
        new_import,
        '<Route path="/profile/:username" element={<PublicProfile />} />',
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Post-edit safety check failed. Missing marker: {marker}")

    if old_import in source:
        fail("Post-edit safety check failed: old profile import still exists")

    APP.write_text(source, encoding="utf-8")
    print(f"[use_public_profile_page_route] patched: {APP}")

    print("")
    print("[use_public_profile_page_route] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"pages/profile/PublicProfile|pages/public/PublicProfile|/profile/:username\" src/App.jsx -C 8")
    print("  git diff -- src/App.jsx")


if __name__ == "__main__":
    main()
