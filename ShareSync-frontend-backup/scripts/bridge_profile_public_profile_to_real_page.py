#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/profile/PublicProfile.jsx"
REAL_PAGE = ROOT / "src/pages/public/PublicProfile.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[bridge_profile_public_profile_to_real_page] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = '''// src/pages/profile/PublicProfile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE ROUTE BRIDGE
//
// /profile/:username is mounted through App.jsx using this file.
// The real API-driven public profile implementation lives at:
//   src/pages/public/PublicProfile.jsx
//
// Keep this wrapper so existing imports/routes remain stable.
// ═══════════════════════════════════════════════════════════════════════════════

import PublicProfile from "../public/PublicProfile.jsx";

export default PublicProfile;
'''


def main():
    print("[bridge_profile_public_profile_to_real_page] starting")

    if not TARGET.exists():
        fail(f"Missing target file: {TARGET}")

    if not REAL_PAGE.exists():
        fail(f"Missing real public profile page: {REAL_PAGE}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        "src/pages/profile/PublicProfile.jsx",
        "PublicProfileView",
        "Mock data for now",
        "const mockProfile =",
        "export default PublicProfile;",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected old mock-profile marker before rewrite: {marker}")

    if original == NEW_CONTENT:
        print("[bridge_profile_public_profile_to_real_page] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-bridge-real-public-profile-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[bridge_profile_public_profile_to_real_page] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[bridge_profile_public_profile_to_real_page] patched: {TARGET}")

    print("")
    print("[bridge_profile_public_profile_to_real_page] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Mock data|PublicProfileView|pages/public/PublicProfile|PUBLIC PROFILE ROUTE BRIDGE|export default PublicProfile\" src/pages/profile/PublicProfile.jsx src/pages/public/PublicProfile.jsx src/App.jsx -C 8")
    print("  git diff -- src/pages/profile/PublicProfile.jsx")


if __name__ == "__main__":
    main()
