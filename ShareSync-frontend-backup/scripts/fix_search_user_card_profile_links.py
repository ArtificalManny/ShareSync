#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
CARD = ROOT / "src/components/search/cards/UserResultCard.jsx"
PAGE = ROOT / "src/pages/SearchPage.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_search_user_card_profile_links] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path, source: str):
    backup_path = path.with_name(f"{path.name}.bak-profile-link-fix-{STAMP}")
    backup_path.write_text(source, encoding="utf-8")
    print(f"[fix_search_user_card_profile_links] backup created: {backup_path}")


def patch_card():
    print("[fix_search_user_card_profile_links] patching UserResultCard.jsx")

    if not CARD.exists():
        fail(f"Missing file: {CARD}")

    source = CARD.read_text(encoding="utf-8")
    original = source

    required = [
        'import { Link } from "react-router-dom";',
        "export default function UserResultCard({ user = {} })",
        "const username = user.username || user.handle || user.slug || user.id;",
        'const uid = user._id || user.id; const href = uid ? `/user/${uid}` : "/profile";',
        "to={href}",
    ]

    for marker in required:
        if marker not in source:
            fail(f"UserResultCard missing expected marker before patch: {marker}")

    old_line = '  const uid = user._id || user.id; const href = uid ? `/user/${uid}` : "/profile";'
    new_block = '''  const profileKey = user.username || user.handle || user.slug || user._id || user.id;
  const href = profileKey
    ? `/profile/${encodeURIComponent(String(profileKey))}`
    : "/profile";'''

    if source.count(old_line) != 1:
        fail("Expected exactly one old /user/:id href line in UserResultCard.jsx")

    source = source.replace(old_line, new_block, 1)

    checks = [
        "const profileKey = user.username || user.handle || user.slug || user._id || user.id;",
        "encodeURIComponent(String(profileKey))",
        'const href = profileKey',
        "to={href}",
    ]

    for marker in checks:
        if marker not in source:
            fail(f"UserResultCard post-edit safety check failed. Missing: {marker}")

    forbidden = [
        "`/user/${uid}`",
        "const uid = user._id || user.id;",
    ]

    for marker in forbidden:
        if marker in source:
            fail(f"UserResultCard post-edit safety check failed. Forbidden marker still exists: {marker}")

    if source != original:
        backup(CARD, original)
        CARD.write_text(source, encoding="utf-8")
        print("[fix_search_user_card_profile_links] patched UserResultCard.jsx")
    else:
        print("[fix_search_user_card_profile_links] UserResultCard.jsx no changes needed")


def patch_page():
    print("[fix_search_user_card_profile_links] patching SearchPage.jsx")

    if not PAGE.exists():
        fail(f"Missing file: {PAGE}")

    source = PAGE.read_text(encoding="utf-8")
    original = source

    required = [
        "const openItem = (item) => {",
        '    } else if (type === "user") {',
        "      const uid = data._id || data.id;",
        "      navigate(uid ? `/user/${uid}` : `/profile`);",
    ]

    for marker in required:
        if marker not in source:
            fail(f"SearchPage missing expected marker before patch: {marker}")

    old_block = '''    } else if (type === "user") {
      const uid = data._id || data.id;
      navigate(uid ? `/user/${uid}` : `/profile`);'''

    new_block = '''    } else if (type === "user") {
      const profileKey = data.username || data.handle || data.slug || data._id || data.id;
      navigate(profileKey ? `/profile/${encodeURIComponent(String(profileKey))}` : `/profile`);'''

    if source.count(old_block) != 1:
        fail("Expected exactly one old user openItem navigation block in SearchPage.jsx")

    source = source.replace(old_block, new_block, 1)

    checks = [
        "const profileKey = data.username || data.handle || data.slug || data._id || data.id;",
        "navigate(profileKey ? `/profile/${encodeURIComponent(String(profileKey))}` : `/profile`);",
    ]

    for marker in checks:
        if marker not in source:
            fail(f"SearchPage post-edit safety check failed. Missing: {marker}")

    forbidden = [
        "navigate(uid ? `/user/${uid}` : `/profile`);",
    ]

    for marker in forbidden:
        if marker in source:
            fail(f"SearchPage post-edit safety check failed. Forbidden marker still exists: {marker}")

    if source != original:
        backup(PAGE, original)
        PAGE.write_text(source, encoding="utf-8")
        print("[fix_search_user_card_profile_links] patched SearchPage.jsx")
    else:
        print("[fix_search_user_card_profile_links] SearchPage.jsx no changes needed")


def main():
    print("[fix_search_user_card_profile_links] starting")
    patch_card()
    patch_page()

    print("")
    print("[fix_search_user_card_profile_links] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"profileKey|/profile/|/user/|/users/|navigate\\(\" src/components/search/cards/UserResultCard.jsx src/pages/SearchPage.jsx src/App.jsx -C 8")
    print("  git diff -- src/components/search/cards/UserResultCard.jsx src/pages/SearchPage.jsx")


if __name__ == "__main__":
    main()
