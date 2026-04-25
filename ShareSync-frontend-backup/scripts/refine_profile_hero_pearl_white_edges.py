#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

PROFILE = Path("src/pages/Profile.jsx")


def fail(message: str) -> None:
    print(f"[refine_profile_hero_pearl_white_edges] ERROR: {message}")
    sys.exit(1)


def replace_one(text: str, pattern: str, replacement: str, label: str, flags: int = 0) -> tuple[str, bool]:
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count == 0:
        return text, False
    print(f"[refine_profile_hero_pearl_white_edges] replaced: {label}")
    return new_text, True


def main() -> None:
    print("[refine_profile_hero_pearl_white_edges] starting")

    if not PROFILE.exists():
        fail(f"Profile file not found: {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")

    header_marker = "HEADER SECTION"
    grid_marker = "MAIN GRID"

    header_idx = source.find(header_marker)
    grid_idx = source.find(grid_marker)

    if header_idx == -1:
        fail("Could not find 'HEADER SECTION' marker.")
    if grid_idx == -1:
        fail("Could not find 'MAIN GRID' marker.")
    if grid_idx <= header_idx:
        fail("'MAIN GRID' marker appears before 'HEADER SECTION'; aborting for safety.")

    header_block = source[header_idx:grid_idx]
    original_header_block = header_block

    # ------------------------------------------------------------------
    # 1) OUTER HERO WRAPPER
    #    Make the panel whiter, softer, and a little lighter in visual weight.
    # ------------------------------------------------------------------
    wrapper_pattern = (
        r'(<div\s+className=")'
        r'(relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-\[2rem\][^"]*)'
        r'(")'
    )

    wrapper_replacement = (
        r'\1'
        r'relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden '
        r'rounded-[2rem] border border-white/90 bg-white/90 px-6 py-8 text-center '
        r'shadow-[0_18px_50px_rgba(139,92,246,0.06)] backdrop-blur-xl sm:px-10 sm:py-10'
        r'\3'
    )

    header_block, wrapper_found = replace_one(
        header_block,
        wrapper_pattern,
        wrapper_replacement,
        "hero wrapper"
    )

    if not wrapper_found:
        fail(
            "Could not find the current hero wrapper inside HEADER SECTION. "
            "No changes were written."
        )

    # ------------------------------------------------------------------
    # 2) ATMOSPHERIC OVERLAY
    #    Push it toward pearl-white glass instead of gray/silver.
    # ------------------------------------------------------------------
    overlay_pattern = (
        r'<div\s+className="pointer-events-none absolute inset-0 '
        r'bg-\[radial-gradient\([^"]+\)\]"\s*/>'
    )

    overlay_replacement = (
        '<div className="pointer-events-none absolute inset-0 '
        'bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.95),'
        'rgba(255,255,255,0.88)_28%,rgba(255,255,255,0.72)_48%,'
        'rgba(139,92,246,0.05)_68%,rgba(34,211,238,0.035)_100%)]" />'
    )

    header_block, overlay_found = replace_one(
        header_block,
        overlay_pattern,
        overlay_replacement,
        "atmospheric radial overlay"
    )

    if not overlay_found:
        fail(
            "Could not find the atmospheric radial overlay inside HEADER SECTION. "
            "No changes were written."
        )

    # ------------------------------------------------------------------
    # 3) CYAN GLOW
    #    Keep the glow, but make it more delicate.
    # ------------------------------------------------------------------
    cyan_pattern = (
        r'<div\s+className="pointer-events-none absolute '
        r'-right-[^"]*? bg-cyan-[^"]*? blur-3xl"\s*/>'
    )

    cyan_replacement = (
        '<div className="pointer-events-none absolute -right-20 -top-20 '
        'h-64 w-64 rounded-full bg-cyan-300/8 blur-3xl" />'
    )

    header_block, cyan_found = replace_one(
        header_block,
        cyan_pattern,
        cyan_replacement,
        "cyan glow"
    )

    if not cyan_found:
        fail(
            "Could not find the cyan glow block inside HEADER SECTION. "
            "No changes were written."
        )

    # ------------------------------------------------------------------
    # 4) VIOLET GLOW
    #    Again, softer and less gray-feeling.
    # ------------------------------------------------------------------
    violet_pattern = (
        r'<div\s+className="pointer-events-none absolute '
        r'-left-[^"]*? bg-violet-[^"]*? blur-3xl"\s*/>'
    )

    violet_replacement = (
        '<div className="pointer-events-none absolute -left-16 bottom-0 '
        'h-64 w-64 rounded-full bg-violet-300/8 blur-3xl" />'
    )

    header_block, violet_found = replace_one(
        header_block,
        violet_pattern,
        violet_replacement,
        "violet glow"
    )

    if not violet_found:
        fail(
            "Could not find the violet glow block inside HEADER SECTION. "
            "No changes were written."
        )

    # ------------------------------------------------------------------
    # 5) TOP SHEEN
    #    Slightly brighter top highlight for the pearl effect.
    # ------------------------------------------------------------------
    sheen_pattern = (
        r'<div\s+className="pointer-events-none absolute '
        r'inset-x-[^"]*? top-0 h-px bg-gradient-to-r '
        r'from-transparent via-white/[^"]*? to-transparent"\s*/>'
    )

    sheen_replacement = (
        '<div className="pointer-events-none absolute inset-x-10 top-0 h-px '
        'bg-gradient-to-r from-transparent via-white/95 to-transparent" />'
    )

    header_block, sheen_found = replace_one(
        header_block,
        sheen_pattern,
        sheen_replacement,
        "top sheen"
    )

    if not sheen_found:
        fail(
            "Could not find the top sheen line inside HEADER SECTION. "
            "No changes were written."
        )

    # ------------------------------------------------------------------
    # SAFETY CHECKS
    # ------------------------------------------------------------------
    required_strings = [
        'bg-white/90',
        'border-white/90',
        'shadow-[0_18px_50px_rgba(139,92,246,0.06)]',
        'rgba(255,255,255,0.95)',
        'rgba(255,255,255,0.88)_28%',
        'rgba(255,255,255,0.72)_48%',
        'rgba(139,92,246,0.05)_68%',
        'rgba(34,211,238,0.035)_100%',
        'bg-cyan-300/8',
        'bg-violet-300/8',
        'via-white/95',
    ]

    for item in required_strings:
        if item not in header_block:
            fail(f"Safety check failed: expected token missing after patch: {item}")

    if header_block == original_header_block:
        fail("No effective changes were made. Aborting.")

    updated_source = source[:header_idx] + header_block + source[grid_idx:]

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = PROFILE.with_name(f"{PROFILE.name}.bak-refine-profile-hero-pearl-white-{timestamp}")
    backup.write_text(source, encoding="utf-8")
    print(f"[refine_profile_hero_pearl_white_edges] backup created: {backup}")

    PROFILE.write_text(updated_source, encoding="utf-8")
    print(f"[refine_profile_hero_pearl_white_edges] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "HEADER SECTION|bg-white/90|border-white/90|radial-gradient|bg-cyan-300/8|bg-violet-300/8|via-white/95|MAIN GRID" src/pages/Profile.jsx -C 8')
    print("  git diff -- src/pages/Profile.jsx")


if __name__ == "__main__":
    main()
