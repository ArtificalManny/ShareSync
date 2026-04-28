#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

TARGET = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend/src/user/user.service.ts")
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

def fail(msg):
    print(f"\n[debug_user_search_counts] ERROR: {msg}\n", file=sys.stderr)
    sys.exit(1)

src = TARGET.read_text()

OLD_1 = """    const candidates = await this.userModel
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

    const phraseNeedle = q.toLowerCase();"""

NEW_1 = """    const candidates = await this.userModel
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

    console.log('[user-search-debug]', {
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

    const phraseNeedle = q.toLowerCase();"""

OLD_2 = """    if (filtered.length === 0 && tokenNeedles.length > 1) {
      const firstTokenRegex = new RegExp(escapeRegex(tokens[0]), 'i');"""

NEW_2 = """    console.log('[user-search-debug]', {
      q,
      normalizedCount: normalized.length,
      filteredCountBeforeFallback: filtered.length,
      normalizedNames: normalized.map((u: any) => ({
        username: u.username,
        displayName: u.displayName,
        searchableText: u.__searchableText,
      })),
    });

    if (filtered.length === 0 && tokenNeedles.length > 1) {
      const firstTokenRegex = new RegExp(escapeRegex(tokens[0]), 'i');"""

OLD_3 = """      filtered = (fallbackCandidates || [])
        .map((user: any) => {"""

NEW_3 = """      console.log('[user-search-debug]', {
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

      filtered = (fallbackCandidates || [])
        .map((user: any) => {"""

for old in [OLD_1, OLD_2, OLD_3]:
    if src.count(old) != 1:
        fail(f"Expected block not found exactly once: {old[:80]}...")

backup = TARGET.with_name(f"{TARGET.name}.bak-user-search-debug-{STAMP}")
backup.write_text(src)
print(f"[debug_user_search_counts] backup created: {backup}")

src = src.replace(OLD_1, NEW_1, 1)
src = src.replace(OLD_2, NEW_2, 1)
src = src.replace(OLD_3, NEW_3, 1)

TARGET.write_text(src)
print("[debug_user_search_counts] patched")
print("")
print("Next:")
print("  npm run build")
print("  restart backend")
print("  curl the Manny Rivas search again")
