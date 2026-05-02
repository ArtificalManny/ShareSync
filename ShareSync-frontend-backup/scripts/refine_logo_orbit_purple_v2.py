#!/usr/bin/env python3
"""
Refine OpenShareLogo to single-element orbit mark in solid purple.
v2: Fixes verification ordering bug — import cleanup runs BEFORE
verifications, not after.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/components/ui/OpenShareLogo.jsx")

src = PATH.read_text(encoding="utf-8")

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

OLD_ACCENT = '''  const id = useId();
  const gradientId = `${id}-openshare-flow`;
  const accent = monochrome ? "currentColor" : `url(#${gradientId})`;'''

NEW_ACCENT = '''  const accent = monochrome ? "currentColor" : "#7C3AED";'''

OLD_IMPORT = "import React, { useId } from 'react';"
NEW_IMPORT = "import React from 'react';"

# ─────────────────────────────────────────────────────────────────────
# PRE-EDIT SAFETY: all three anchors must match exactly once
# ─────────────────────────────────────────────────────────────────────
checks = [
    ("OLD (svg block)", OLD, 1),
    ("OLD_ACCENT (gradient logic)", OLD_ACCENT, 1),
    ("OLD_IMPORT (useId import)", OLD_IMPORT, 1),
]

for name, anchor, expected in checks:
    actual = src.count(anchor)
    if actual != expected:
        print(f"ERROR: {name} matched {actual} times, expected {expected}.", file=sys.stderr)
        sys.exit(1)

# ─────────────────────────────────────────────────────────────────────
# BACKUP
# ─────────────────────────────────────────────────────────────────────
backup = PATH.with_suffix(PATH.suffix + ".bak.before-logo-refinement-v2")
backup.write_text(src, encoding="utf-8")
print(f"Backup: {backup}")

# ─────────────────────────────────────────────────────────────────────
# APPLY ALL THREE EDITS ON SAME IN-MEMORY STRING
# ─────────────────────────────────────────────────────────────────────
new_src = src
new_src = new_src.replace(OLD, NEW, 1)
new_src = new_src.replace(OLD_ACCENT, NEW_ACCENT, 1)
new_src = new_src.replace(OLD_IMPORT, NEW_IMPORT, 1)

# ─────────────────────────────────────────────────────────────────────
# POST-EDIT VERIFICATION (now ALL edits have been applied)
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
    # useId should be gone (import was cleaned up)
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
# WRITE ONCE
# ─────────────────────────────────────────────────────────────────────
PATH.write_text(new_src, encoding="utf-8")

print()
print("✓ Logo refined: single-element orbit, solid #7C3AED purple.")
print()
print(f"Hard refresh: Cmd+Shift+R on http://localhost:54693")
print()
print(f"Recovery: cp {backup} {PATH}")
