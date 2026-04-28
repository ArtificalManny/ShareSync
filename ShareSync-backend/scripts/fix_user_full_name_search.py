#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_user_full_name_search] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_METHOD = """  async searchUsers(query: string, limit = 10): Promise<any[]> {
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


def main():
    print("[fix_user_full_name_search] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class UserService",
        "private readonly userModel: Model<UserDocument>",
        "async searchUsers(query: string, limit =",
        "async getActivitySummary(userId: string): Promise<any>",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    pattern = re.compile(
        r"  async searchUsers\(query: string, limit = \d+\): Promise<any\[\]> \{[\s\S]*?\n  \}\n\n  async getActivitySummary",
        re.MULTILINE,
    )

    match = pattern.search(source)
    if not match:
      fail("Could not find the existing searchUsers method block.")

    replacement = NEW_METHOD + "\n\n  async getActivitySummary"
    source = source[:match.start()] + replacement + source[match.end():]

    required_after = [
        "const tokens = q",
        "$and: tokenClauses",
        "displayName: phraseRegex",
        "firstName: tokenRegex",
        "lastName: tokenRegex",
        ".lean()",
        "displayName,",
        "avatarUrl: user.avatarUrl || user.profilePicture || user.avatar || null",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[fix_user_full_name_search] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-full-name-search-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_user_full_name_search] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_user_full_name_search] patched: {TARGET}")

    print("")
    print("[fix_user_full_name_search] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"searchUsers|tokenClauses|displayName|firstName: tokenRegex|lastName: tokenRegex|publicProfile|avatarUrl\" src/user/user.service.ts -C 10")
    print("  git diff -- src/user/user.service.ts")


if __name__ == "__main__":
    main()
