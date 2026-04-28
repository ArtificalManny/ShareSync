#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[remove_user_search_debug_logs] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


DEBUG_1 = """    console.log('[user-search-debug]', {
      q,
      tokens,
      candidateCount: candidates?.length || 0,
      candidateNames: (candidates || []).map((u: any) => ({
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        name: u.name,
        displayName: u.displayName,
        publicProfile: u.publicProfile,
      })),
    });

"""

DEBUG_2 = """    console.log('[user-search-debug]', {
      q,
      normalizedCount: normalized.length,
      filteredCountBeforeFallback: filtered.length,
      normalizedNames: normalized.map((u: any) => ({
        username: u.username,
        displayName: u.displayName,
        searchableText: u.__searchableText,
      })),
    });

"""

DEBUG_3 = """      console.log('[user-search-debug]', {
        q,
        fallbackCandidateCount: fallbackCandidates?.length || 0,
        fallbackCandidateNames: (fallbackCandidates || []).map((u: any) => ({
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          name: u.name,
          displayName: u.displayName,
          publicProfile: u.publicProfile,
        })),
      });

"""


def main():
    print("[remove_user_search_debug_logs] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    src = TARGET.read_text(encoding="utf-8")
    original = src

    backup = TARGET.with_name(f"{TARGET.name}.bak-remove-user-search-debug-{STAMP}")
    backup.write_text(src, encoding="utf-8")
    print(f"[remove_user_search_debug_logs] backup created: {backup}")

    removed = 0
    for block in [DEBUG_1, DEBUG_2, DEBUG_3]:
        count = src.count(block)
        if count > 1:
            fail("A debug block appeared more than once. Aborting.")
        if count == 1:
            src = src.replace(block, "", 1)
            removed += 1

    if removed == 0:
        print("[remove_user_search_debug_logs] no debug logs found")
        return

    if "[user-search-debug]" in src:
        fail("Post-edit safety check failed: [user-search-debug] still exists")

    required = [
        "async searchUsers(query: string, limit = 10): Promise<any[]>",
        "const candidates = await this.userModel",
        "let filtered = normalized.filter",
        "return filtered",
        "async getStreakProtectionStatus(userId: string): Promise<any>",
        "async useStreakFreeze(userId: string): Promise<any>",
    ]

    for marker in required:
        if marker not in src:
            fail(f"Post-edit safety check failed. Missing marker: {marker}")

    TARGET.write_text(src, encoding="utf-8")
    print(f"[remove_user_search_debug_logs] removed {removed} debug block(s)")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"user-search-debug|searchUsers|candidateClauses|let filtered|getStreakProtectionStatus|useStreakFreeze\" src/user/user.service.ts -C 8")
    print("  git diff -- src/user/user.service.ts")


if __name__ == "__main__":
    main()
