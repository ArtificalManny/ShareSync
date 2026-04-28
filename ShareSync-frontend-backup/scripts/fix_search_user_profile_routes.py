#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/api/search.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_search_user_profile_routes] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_search_user_profile_routes] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "async function searchUsers(query, limit = 10)",
        "const res = await api.get('/users/search', { params: { q: query, limit } });",
        "type: 'person',",
        "url: `/users/${u.username || u._id || u.id}`,",
        'console.log("[search-debug] searchAll requestedTypes:", requestedTypes);',
        'console.log("[search-debug] searchAll fetchers count:", fetchers.length);',
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Route user search results to the mounted public profile route.
    old_url = "        url: `/users/${u.username || u._id || u.id}`,"
    new_url = "        url: `/profile/${encodeURIComponent(u.username || u._id || u.id)}`,"

    if source.count(old_url) != 1:
        fail("Expected exactly one /users/:id search result URL to replace.")

    source = source.replace(old_url, new_url, 1)
    print("[fix_search_user_profile_routes] updated person result URL to /profile/:username")

    # 2) Remove temporary search debug logs.
    debug_block = """  console.log("[search-debug] searchAll requestedTypes:", requestedTypes);
  console.log("[search-debug] searchAll fetchers count:", fetchers.length);
  settled.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      console.log(`[search-debug] fetcher #${idx} fulfilled, length:`, Array.isArray(result.value) ? result.value.length : 'NOT AN ARRAY', 'value:', result.value);
    } else {
      console.log(`[search-debug] fetcher #${idx} rejected:`, result.reason);
    }
  });

"""

    if source.count(debug_block) != 1:
        fail("Expected exactly one temporary search-debug block to remove.")

    source = source.replace(debug_block, "", 1)
    print("[fix_search_user_profile_routes] removed temporary search-debug logs")

    required_after = [
        "async function searchUsers(query, limit = 10)",
        "type: 'person',",
        "url: `/profile/${encodeURIComponent(u.username || u._id || u.id)}`,",
        "export async function searchAll(payloadOrQuery)",
        "const settled = await Promise.allSettled(fetchers);",
        "return deduped;",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Post-edit safety check failed. Missing marker: {marker}")

    forbidden_after = [
        "url: `/users/${u.username || u._id || u.id}`,",
        "[search-debug]",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Post-edit safety check failed. Forbidden marker still exists: {marker}")

    if source == original:
        print("[fix_search_user_profile_routes] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-profile-search-routes-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_search_user_profile_routes] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_search_user_profile_routes] patched: {TARGET}")

    print("")
    print("[fix_search_user_profile_routes] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"url: `/profile/|url: `/users/|search-debug|searchUsers|type: 'person'\" src/api/search.js -C 8")
    print("  git diff -- src/api/search.js")


if __name__ == "__main__":
    main()
