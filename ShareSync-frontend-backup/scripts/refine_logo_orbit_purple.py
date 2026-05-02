#!/usr/bin/env python3
"""
Refine OpenShareLogo to single-element orbit mark in solid purple.

Brief (from brand exercise):
  - Personality: simple, straightforward, easy to use
  - Aesthetic refs: Apple, NVIDIA, Tesla — ONE element, ONE color
  - Should be recognized at a glance
  - Should NOT be noticed for too long

Refinement decisions:
  - Drop the inner S-flow (was competing with the orbit)
  - Keep the broken-arc orbit as the entire mark
  - Replace 3-stop gradient with single solid #7C3AED
  - Slightly thicken stroke for stronger presence at small sizes
  - Add subtle terminal end-caps so the broken arc reads intentional, not cropped

Strategy: surgical — replace just the SVG block. Keep component name,
props, viewBox, monochrome support. Backwards-compatible.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/components/ui/OpenShareLogo.jsx")

src = PATH.read_text(encoding="utf-8")

# ─────────────────────────────────────────────────────────────────────
# OLD: the entire SVG block in the current file (everything from <svg...
#      through </svg>, including the gradient defs and both paths)
# ─────────────────────────────────────────────────────────────────────
OLD = '''    <svg
      viewBox="0 0 36 36"
      width="1em"
      height="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <title>{title}</title>

      <defs>
        <linearGradient
          id={gradientId}
          x1="9"
          y1="26"
          x2="27"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Open orbit: signals openness, system, continuity */}
      <path
        d="M24.2 4.4A14 14 0 1 1 6 26.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Shared flow: one continuous motion inside the orbit */}
      <path
        d="
          M23.1 10.2
          C20.7 8.4 16 8.1 12.8 9.4
          C9.8 10.7 9.5 13.8 12.3 15
          C13.4 15.4 14.8 15.8 16.4 16.1
          C18.7 16.5 20.4 16.9 21.5 17.7
          C24 19.4 23.8 22.7 21.1 24.5
          C18.2 26.4 13.6 26.2 10.8 24.2
        "
        stroke={accent}
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>'''

# ─────────────────────────────────────────────────────────────────────
# NEW: single-element orbit mark in solid purple.
#
# The path traces ~280° of a circle centered at (18, 18) with radius 13.
# Starting at the top-right (the "opening"), sweeps clockwise around
# back to the upper-right area, leaving a deliberate gap at the top
# right. The gap is the "open" in OpenShare — small, intentional, not
# accidental.
#
# Stroke is 3.6 (slightly thicker than original 3.2) for presence at
# 16px favicons. Round caps soften the gap terminals so they read as
# intentional design, not as a cropped circle.
#
# Monochrome prop still works: fill="none" + stroke="currentColor" with
# {accent} respected. When monochrome=true → currentColor (inherits
# text color). When false → solid #7C3AED.
# ─────────────────────────────────────────────────────────────────────
NEW = '''    <svg
      viewBox="0 0 36 36"
      width="1em"
      height="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <title>{title}</title>

      {/*
        Single-element orbit mark.
        Broken arc (~280°) = "open" in OpenShare.
        One color. One concept. One stroke.
        Reads as a stylized O at a glance.
      */}
      <path
        d="M26.2 8.5
           A 13 13 0 1 1 14.6 5.4"
        stroke={accent}
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>'''

# ─────────────────────────────────────────────────────────────────────
# PRE-EDIT SAFETY
# ─────────────────────────────────────────────────────────────────────
if src.count(OLD) != 1:
    print(f"ERROR: SVG block anchor matched {src.count(OLD)} times, expected 1.", file=sys.stderr)
    print("File may have been modified since the last diagnostic. Aborting.", file=sys.stderr)
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────
# Also need to update the `accent` line so non-monochrome renders in
# solid #7C3AED instead of the gradient URL. The current line is:
#   const accent = monochrome ? "currentColor" : `url(#${gradientId})`;
# Replace with solid color path.
# ─────────────────────────────────────────────────────────────────────
OLD_ACCENT = '''  const id = useId();
  const gradientId = `${id}-openshare-flow`;
  const accent = monochrome ? "currentColor" : `url(#${gradientId})`;'''

NEW_ACCENT = '''  const accent = monochrome ? "currentColor" : "#7C3AED";'''

if src.count(OLD_ACCENT) != 1:
    print(f"ERROR: accent declaration anchor matched {src.count(OLD_ACCENT)} times, expected 1.", file=sys.stderr)
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────
# BACKUP BEFORE MUTATION
# ─────────────────────────────────────────────────────────────────────
backup = PATH.with_suffix(PATH.suffix + ".bak.before-logo-refinement")
backup.write_text(src, encoding="utf-8")
print(f"Backup: {backup}")

# ─────────────────────────────────────────────────────────────────────
# APPLY BOTH EDITS ON THE SAME IN-MEMORY STRING
# ─────────────────────────────────────────────────────────────────────
new_src = src
new_src = new_src.replace(OLD, NEW, 1)
new_src = new_src.replace(OLD_ACCENT, NEW_ACCENT, 1)

# ─────────────────────────────────────────────────────────────────────
# POST-EDIT VERIFICATION
# ─────────────────────────────────────────────────────────────────────
verifications = [
    # New SVG should contain the orbit path
    ('A 13 13 0 1 1', 1),
    # Old gradient should be gone
    ('linearGradient', 0),
    ('stopColor="#06B6D4"', 0),
    # Old S-flow path should be gone
    ('M23.1 10.2', 0),
    # New solid color
    ('"#7C3AED"', 1),
    # gradientId reference should be gone
    ('gradientId', 0),
    ('useId', 0),
    # Component shell intact
    ('export default function OpenShareLogo', 1),
    ('viewBox="0 0 36 36"', 1),
]

for marker, expected in verifications:
    actual = new_src.count(marker)
    if actual != expected:
        print(f"ERROR: '{marker}' appears {actual} times, expected {expected}.", file=sys.stderr)
        print(f"NOT writing file. Backup intact at: {backup}", file=sys.stderr)
        sys.exit(1)

# ─────────────────────────────────────────────────────────────────────
# Also clean up the unused useId import since we no longer use it.
# ─────────────────────────────────────────────────────────────────────
OLD_IMPORT = "import React, { useId } from 'react';"
NEW_IMPORT = "import React from 'react';"

if new_src.count(OLD_IMPORT) == 1:
    new_src = new_src.replace(OLD_IMPORT, NEW_IMPORT, 1)
    print("Cleaned up unused useId import.")
elif new_src.count(OLD_IMPORT) == 0:
    print("Note: useId import already removed or not present.")
else:
    print("Warning: multiple useId imports found, leaving alone.", file=sys.stderr)

# ─────────────────────────────────────────────────────────────────────
# WRITE ONCE
# ─────────────────────────────────────────────────────────────────────
PATH.write_text(new_src, encoding="utf-8")

print()
print("✓ Logo refined: single-element orbit, solid #7C3AED purple.")
print()
print("What changed:")
print("  - Removed the inner S-flow path (was competing with orbit)")
print("  - Removed the 3-stop gradient (purple → cyan)")
print("  - Replaced with single solid #7C3AED purple")
print("  - Stroke slightly thicker (3.2 → 3.6) for 16px presence")
print("  - Cleaned up unused useId / gradientId logic")
print()
print("Test these render contexts:")
print("  - Browser tab favicon (16x16)")
print("  - Top-left nav (~28-32px)")
print("  - Login/auth screens (larger)")
print("  - Dark mode (the monochrome prop should still work)")
print()
print(f"Hard refresh: Cmd+Shift+R on http://localhost:54693")
print()
print(f"Recovery if you don't like it:")
print(f"  cp {backup} {PATH}")
