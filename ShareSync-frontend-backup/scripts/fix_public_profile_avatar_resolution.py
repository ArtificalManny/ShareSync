#!/usr/bin/env python3
"""
Surgical fix for public profile avatar resolution bug.

Bug: When viewing /profile/:username (someone else's public profile), the page
shows the LOGGED-IN user's avatar instead of the viewed user's avatar. Cause:
ProfilePhotoEditor's displayUrl computation reads localStorage (which only ever
holds the logged-in user's data) before falling through to the backend avatar
of the user being viewed.

Fix: Gate localStorage-derived avatar sources (localOverride, storedAvatar) and
the local previewUrl behind isOwnProfile. When viewing another user's profile,
those sources should be skipped entirely so backendAvatar wins.

Scope: One file, one anchored str.replace, automatic backup, post-edit verification.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/pages/Profile.jsx")

src = PATH.read_text(encoding="utf-8")

# Exact anchor — copied verbatim from sed output of lines 506-512
OLD = """  const displayUrl =
    previewUrl || localOverride || storedAvatar || backendAvatar || "/default-profile.png";"""

# Replacement — same logic for own profile, but for public profile only backendAvatar applies
NEW = """  const displayUrl =
    (isOwnProfile
      ? previewUrl || localOverride || storedAvatar || backendAvatar
      : backendAvatar) || "/default-profile.png";"""

# Safety check 1: anchor must appear EXACTLY ONCE
occurrences = src.count(OLD)
if occurrences != 1:
    print(f"ERROR: anchor found {occurrences} times. Expected exactly 1.", file=sys.stderr)
    print("File NOT modified. The displayUrl block may have been edited since the diagnostic was taken.", file=sys.stderr)
    print("Re-run: sed -n '505,515p' src/pages/Profile.jsx", file=sys.stderr)
    sys.exit(1)

# Backup before mutation
backup = PATH.with_suffix(PATH.suffix + ".bak.before-public-avatar-fix")
backup.write_text(src, encoding="utf-8")
print(f"Backup written to: {backup}")

new_src = src.replace(OLD, NEW, 1)

# Safety check 2: verify our replacement landed correctly
expected_marker = "isOwnProfile\n      ? previewUrl || localOverride || storedAvatar || backendAvatar"
if new_src.count(expected_marker) != 1:
    print("ERROR: post-edit verification failed. Replacement marker not found.", file=sys.stderr)
    print("File NOT modified.", file=sys.stderr)
    sys.exit(1)

# Safety check 3: confirm we didn't accidentally duplicate the displayUrl declaration
if new_src.count("const displayUrl =") != 1:
    print(f"ERROR: 'const displayUrl =' appears {new_src.count('const displayUrl =')} times. Expected 1.", file=sys.stderr)
    print("File NOT modified.", file=sys.stderr)
    sys.exit(1)

PATH.write_text(new_src, encoding="utf-8")
print("✓ Fix applied successfully.")
print()
print("Behavior change:")
print("  - /profile (own profile): unchanged — uses previewUrl, localStorage, backend, default fallback")
print("  - /profile/:username (public): now uses ONLY the viewed user's backendAvatar with default fallback")
print()
print("Recovery if needed:")
print(f"  cp {backup} {PATH}")
