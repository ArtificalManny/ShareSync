#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_user_search_full_phrase_candidates] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


OLD = """  async searchUsers(query: string, limit = 10): Promise<any[]> {
    const q = String(query || '').trim();

    if (!q || q.length < 2) {
      return [];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const escaped = q.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    const phraseRegex = new RegExp(escaped, 'i');

    const tokens = q
      .split(/\\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 5);

    const tokenClauses = tokens.map((token) => {
      const tokenRegex = new RegExp(
        token.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'),
        'i',
      );

      return {
        $or: [
          { username: tokenRegex },
          { firstName: tokenRegex },
          { lastName: tokenRegex },
          { displayName: tokenRegex },
          { name: tokenRegex },
        ],
      };
    });

    const searchQuery: any = {
      publicProfile: { $ne: false },
      $or: [
        { username: phraseRegex },
        { firstName: phraseRegex },
        { lastName: phraseRegex },
        { displayName: phraseRegex },
        { name: phraseRegex },
        ...(tokenClauses.length > 1 ? [{ $and: tokenClauses }] : tokenClauses),
      ],
    };

    const users = await this.userModel
      .find(searchQuery)
      .select(
        '_id username firstName lastName displayName name profilePicture avatarUrl avatar bio publicProfile createdAt',
      )
      .limit(safeLimit)
      .lean()
      .exec();

    return (users || []).map((user: any) => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const displayName =
        user.displayName ||
        user.name ||
        `${firstName} ${lastName}`.trim() ||
        user.username ||
        'User';

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
      };
    });
  }"""

NEW = """  async searchUsers(query: string, limit = 10): Promise<any[]> {
    const q = String(query || '').trim();

    if (!q || q.length < 2) {
      return [];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');

    const tokens = q
      .split(/\\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 5);

    const phraseRegex = new RegExp(escapeRegex(q), 'i');
    const tokenRegexes = tokens.map((token) => new RegExp(escapeRegex(token), 'i'));

    const candidateClauses: any[] = [
      { username: phraseRegex },
      { firstName: phraseRegex },
      { lastName: phraseRegex },
      { displayName: phraseRegex },
      { name: phraseRegex },
      { email: phraseRegex },
    ];

    for (const tokenRegex of tokenRegexes) {
      candidateClauses.push(
        { username: tokenRegex },
        { firstName: tokenRegex },
        { lastName: tokenRegex },
        { displayName: tokenRegex },
        { name: tokenRegex },
        { email: tokenRegex },
      );
    }

    const candidates = await this.userModel
      .find({
        publicProfile: { $ne: false },
        $or: candidateClauses,
      })
      .select(
        '_id username firstName lastName displayName name email profilePicture avatarUrl avatar bio publicProfile createdAt',
      )
      .limit(Math.max(safeLimit * 4, 50))
      .lean()
      .exec();

    const phraseNeedle = q.toLowerCase();
    const tokenNeedles = tokens.map((token) => token.toLowerCase());

    const normalized = (candidates || []).map((user: any) => {
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
    });

    return normalized
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
      .map(({ __searchableText, ...user }: any) => user);
  }"""


def main():
    print("[fix_user_search_full_phrase_candidates] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    src = TARGET.read_text(encoding="utf-8")

    if src.count(OLD) != 1:
        fail(
            "Expected exact searchUsers block was not found exactly once. "
            "Run: sed -n '382,464p' src/user/user.service.ts"
        )

    backup = TARGET.with_name(f"{TARGET.name}.bak-candidate-user-search-{STAMP}")
    backup.write_text(src, encoding="utf-8")
    print(f"[fix_user_search_full_phrase_candidates] backup created: {backup}")

    new_src = src.replace(OLD, NEW, 1)

    checks = [
        "const candidateClauses: any[] = [",
        "for (const tokenRegex of tokenRegexes)",
        "const candidates = await this.userModel",
        "const searchableText = [",
        "`${firstName} ${lastName}`.trim()",
        "tokenNeedles.every((token) => user.__searchableText.includes(token))",
        ".map(({ __searchableText, ...user }: any) => user);",
    ]

    for check in checks:
        if new_src.count(check) < 1:
            fail(f"Post-edit safety check failed. Missing: {check}")

    TARGET.write_text(new_src, encoding="utf-8")
    print(f"[fix_user_search_full_phrase_candidates] patched: {TARGET}")

    print("")
    print("[fix_user_search_full_phrase_candidates] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"searchUsers|candidateClauses|tokenRegexes|searchableText|tokenNeedles|publicProfile\" src/user/user.service.ts -C 10")
    print("  git diff -- src/user/user.service.ts")


if __name__ == "__main__":
    main()
