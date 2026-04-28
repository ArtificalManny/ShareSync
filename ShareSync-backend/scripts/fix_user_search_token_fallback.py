#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_user_search_token_fallback] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_user_search_token_fallback] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required = [
        "async searchUsers(query: string, limit = 10): Promise<any[]>",
        "const normalized = (candidates || []).map((user: any) => {",
        "return normalized",
        ".filter((user: any) => {",
        ".map(({ __searchableText, ...user }: any) => user);",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    old_return_block = """    return normalized
      .filter((user: any) => {
        if (user.__searchableText.includes(phraseNeedle)) return true;
        return tokenNeedles.every((token) => user.__searchableText.includes(token));
      })
      .sort((a: any, b: any) => {
        const aName = String(a.displayName || a.name || '').toLowerCase();
        const bName = String(b.displayName || b.name || '').toLowerCase();

        const aExact = aName === phraseNeedle ? 1 : 0;
        const bExact = bName === phraseNeedle ? 1 : 0;

        if (aExact !== bExact) return bExact - aExact;
        return aName.localeCompare(bName);
      })
      .slice(0, safeLimit)
      .map(({ __searchableText, ...user }: any) => user);"""

    new_return_block = """    let filtered = normalized.filter((user: any) => {
      if (user.__searchableText.includes(phraseNeedle)) return true;
      return tokenNeedles.every((token) => user.__searchableText.includes(token));
    });

    // Fallback: if the full phrase produces no results, search by the first token.
    // This protects names like "Manny Rivas" where "Manny" works but the phrase does not.
    if (filtered.length === 0 && tokenNeedles.length > 1) {
      const firstTokenRegex = new RegExp(escapeRegex(tokens[0]), 'i');

      const fallbackCandidates = await this.userModel
        .find({
          publicProfile: { $ne: false },
          $or: [
            { username: firstTokenRegex },
            { firstName: firstTokenRegex },
            { lastName: firstTokenRegex },
            { displayName: firstTokenRegex },
            { name: firstTokenRegex },
            { email: firstTokenRegex },
          ],
        })
        .select(
          '_id username firstName lastName displayName name email profilePicture avatarUrl avatar bio publicProfile createdAt',
        )
        .limit(Math.max(safeLimit * 4, 50))
        .lean()
        .exec();

      filtered = (fallbackCandidates || [])
        .map((user: any) => {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const displayName =
            user.displayName ||
            user.name ||
            `${firstName} ${lastName}`.trim() ||
            user.username ||
            'User';

          const searchableText = [
            displayName,
            firstName,
            lastName,
            `${firstName} ${lastName}`.trim(),
            user.username,
            user.email,
            user.bio,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return {
            _id: user._id?.toString?.() || user._id,
            id: user._id?.toString?.() || user._id,
            username: user.username || '',
            firstName,
            lastName,
            displayName,
            name: displayName,
            profilePicture: user.profilePicture || null,
            avatarUrl: user.avatarUrl || user.profilePicture || user.avatar || null,
            avatar: user.avatar || null,
            bio: user.bio || '',
            publicProfile: user.publicProfile ?? true,
            createdAt: user.createdAt,
            __searchableText: searchableText,
          };
        })
        .filter((user: any) =>
          tokenNeedles.every((token) => user.__searchableText.includes(token)),
        );
    }

    return filtered
      .sort((a: any, b: any) => {
        const aName = String(a.displayName || a.name || '').toLowerCase();
        const bName = String(b.displayName || b.name || '').toLowerCase();

        const aExact = aName === phraseNeedle ? 1 : 0;
        const bExact = bName === phraseNeedle ? 1 : 0;

        if (aExact !== bExact) return bExact - aExact;
        return aName.localeCompare(bName);
      })
      .slice(0, safeLimit)
      .map(({ __searchableText, ...user }: any) => user);"""

    if old_return_block not in source:
        fail("Could not find exact return/filter block.")

    source = source.replace(old_return_block, new_return_block, 1)

    checks = [
        "let filtered = normalized.filter",
        "Fallback: if the full phrase produces no results",
        "const firstTokenRegex = new RegExp(escapeRegex(tokens[0]), 'i');",
        "fallbackCandidates",
        "tokenNeedles.every((token) => user.__searchableText.includes(token))",
    ]

    for check in checks:
        if check not in source:
            fail(f"Post-edit safety check failed. Missing: {check}")

    backup = TARGET.with_name(f"{TARGET.name}.bak-token-fallback-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_user_search_token_fallback] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_user_search_token_fallback] patched: {TARGET}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Fallback: if the full phrase|fallbackCandidates|firstTokenRegex|let filtered|searchUsers\" src/user/user.service.ts -C 10")
    print("  git diff -- src/user/user.service.ts")


if __name__ == "__main__":
    main()
