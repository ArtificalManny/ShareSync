#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/SearchPage.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_search_page_current_user_route] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_search_page_current_user_route] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        'import { useLocation, useNavigate, useSearchParams } from "react-router-dom";',
        'import useDocumentTitle from "../hooks/useDocumentTitle";',
        "export default function SearchPage() {",
        "const navigate = useNavigate();",
        '    } else if (type === "user") {',
        "const profileKey = data.username || data.handle || data.slug || data._id || data.id;",
        "navigate(profileKey ? `/profile/${encodeURIComponent(String(profileKey))}` : `/profile`);",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add useAuth import.
    auth_import = 'import { useAuth } from "../context/AuthContext";'
    if auth_import not in source:
        insert_after = 'import useDocumentTitle from "../hooks/useDocumentTitle";'
        source = source.replace(insert_after, insert_after + "\n" + auth_import, 1)
        print("[fix_search_page_current_user_route] added useAuth import")
    else:
        print("[fix_search_page_current_user_route] useAuth import already present")

    # 2) Add small normalization helpers before the component.
    helpers = '''function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

'''

    if "function normalizeComparable(value)" not in source:
        component_marker = "export default function SearchPage() {"
        source = source.replace(component_marker, helpers + component_marker, 1)
        print("[fix_search_page_current_user_route] added normalization helpers")
    else:
        print("[fix_search_page_current_user_route] normalization helpers already present")

    # 3) Add auth user inside component.
    if "const { user: authUser } = useAuth();" not in source:
        old = '''  useDocumentTitle("Search");
  const [params, setParams] = useSearchParams();'''
        new = '''  useDocumentTitle("Search");
  const { user: authUser } = useAuth();
  const [params, setParams] = useSearchParams();'''

        if old not in source:
            fail("Could not find component hook insertion point.")

        source = source.replace(old, new, 1)
        print("[fix_search_page_current_user_route] added authUser hook")
    else:
        print("[fix_search_page_current_user_route] authUser hook already present")

    # 4) Replace user openItem route logic.
    old_user_block = '''    } else if (type === "user") {
      const profileKey = data.username || data.handle || data.slug || data._id || data.id;
      navigate(profileKey ? `/profile/${encodeURIComponent(String(profileKey))}` : `/profile`);'''

    new_user_block = '''    } else if (type === "user") {
      const profileKey = data.username || data.handle || data.slug || data._id || data.id;

      const resultUsername = normalizeComparable(data.username || data.handle || data.slug);
      const resultId = normalizeId(data._id || data.id || data.userId);

      const authUsername = normalizeComparable(
        authUser?.username || authUser?.handle || authUser?.slug
      );
      const authId = normalizeId(authUser?._id || authUser?.id || authUser?.userId);

      const isCurrentUser =
        Boolean(resultUsername && authUsername && resultUsername === authUsername) ||
        Boolean(resultId && authId && resultId === authId);

      navigate(
        isCurrentUser
          ? "/profile"
          : profileKey
            ? `/profile/${encodeURIComponent(String(profileKey))}`
            : "/profile"
      );'''

    if source.count(old_user_block) != 1:
        fail("Could not find exact user openItem navigation block.")

    source = source.replace(old_user_block, new_user_block, 1)
    print("[fix_search_page_current_user_route] updated keyboard/open-item user routing")

    # 5) Remove temporary search-debug logs if present.
    debug_block = '''        console.log("[search-debug] payload:", payload);
        console.log("[search-debug] raw data from searchAll:", data);
        const coerced = coerceResults(data);
        console.log("[search-debug] coerced:", coerced);
        setResults(coerced);'''

    clean_block = '''        const coerced = coerceResults(data);
        setResults(coerced);'''

    if debug_block in source:
        source = source.replace(debug_block, clean_block, 1)
        print("[fix_search_page_current_user_route] removed temporary search-debug logs")
    else:
        print("[fix_search_page_current_user_route] temporary search-debug block not found; skipped")

    required_after = [
        'import { useAuth } from "../context/AuthContext";',
        "function normalizeComparable(value)",
        "function normalizeId(value)",
        "const { user: authUser } = useAuth();",
        "const isCurrentUser =",
        '? "/profile"',
        "`/profile/${encodeURIComponent(String(profileKey))}`",
        "setResults(coerced);",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Post-edit safety check failed. Missing marker: {marker}")

    forbidden_after = [
        '[search-debug] payload',
        '[search-debug] raw data from searchAll',
        '[search-debug] coerced',
        "navigate(profileKey ? `/profile/${encodeURIComponent(String(profileKey))}` : `/profile`);",
        "navigate(uid ? `/user/${uid}` : `/profile`);",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Post-edit safety check failed. Forbidden marker still exists: {marker}")

    if source == original:
        print("[fix_search_page_current_user_route] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-current-user-route-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_search_page_current_user_route] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_search_page_current_user_route] patched: {TARGET}")

    print("")
    print("[fix_search_page_current_user_route] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"useAuth|authUser|normalizeComparable|normalizeId|isCurrentUser|search-debug|/user/|/profile/|navigate\\(\" src/pages/SearchPage.jsx -C 8")
    print("  git diff -- src/pages/SearchPage.jsx")


if __name__ == "__main__":
    main()
