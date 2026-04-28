#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/public/PublicProfile.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_public_profile_client_paths] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_public_profile_client_paths] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "import client from '../../api/client';",
        "`/api/users/public/${encodeURIComponent(username)}`",
        "`/api/users/username/${encodeURIComponent(username)}`",
        "`/api/projects?owner=${encodeURIComponent(userId)}&visibility=public`",
        "`/api/projects?ownerId=${encodeURIComponent(userId)}&public=true`",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    replacements = {
        "`/api/users/public/${encodeURIComponent(username)}`":
            "`/users/public/${encodeURIComponent(username)}`",
        "`/api/users/username/${encodeURIComponent(username)}`":
            "`/users/username/${encodeURIComponent(username)}`",
        "`/api/projects?owner=${encodeURIComponent(userId)}&visibility=public`":
            "`/projects?owner=${encodeURIComponent(userId)}&visibility=public`",
        "`/api/projects?ownerId=${encodeURIComponent(userId)}&public=true`":
            "`/projects?ownerId=${encodeURIComponent(userId)}&public=true`",
    }

    for old, new in replacements.items():
        count = source.count(old)
        if count != 1:
            fail(f"Expected exactly one occurrence of {old}, found {count}")
        source = source.replace(old, new, 1)

    required_after = [
        "`/users/public/${encodeURIComponent(username)}`",
        "`/users/username/${encodeURIComponent(username)}`",
        "`/projects?owner=${encodeURIComponent(userId)}&visibility=public`",
        "`/projects?ownerId=${encodeURIComponent(userId)}&public=true`",
        "const res = await client.get(url, { signal: controller.signal });",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Post-edit safety check failed. Missing marker: {marker}")

    forbidden_after = [
        "`/api/users/public/${encodeURIComponent(username)}`",
        "`/api/users/username/${encodeURIComponent(username)}`",
        "`/api/projects?owner=${encodeURIComponent(userId)}&visibility=public`",
        "`/api/projects?ownerId=${encodeURIComponent(userId)}&public=true`",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Post-edit safety check failed. Forbidden marker still exists: {marker}")

    if source == original:
        print("[fix_public_profile_client_paths] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-client-paths-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_public_profile_client_paths] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_public_profile_client_paths] patched: {TARGET}")

    print("")
    print("[fix_public_profile_client_paths] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"client.get|/api/users|/api/projects|/users/public|/users/username|/projects\\?owner\" src/pages/public/PublicProfile.jsx -C 8")
    print("  git diff -- src/pages/public/PublicProfile.jsx")


if __name__ == "__main__":
    main()
