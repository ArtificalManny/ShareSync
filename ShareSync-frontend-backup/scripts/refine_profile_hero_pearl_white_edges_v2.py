#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

PROFILE = Path("src/pages/Profile.jsx")


def fail(message: str) -> None:
    print(f"\n[refine_profile_hero_pearl_white_edges_v2] ERROR: {message}\n")
    sys.exit(1)


def replace_one(text: str, pattern: str, replacement: str, label: str, required: bool = True) -> tuple[str, bool]:
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE | re.DOTALL)

    if count == 0:
        if required:
            fail(f"Could not find {label}. No changes were written.")
        print(f"[refine_profile_hero_pearl_white_edges_v2] optional not found: {label}")
        return text, False

    print(f"[refine_profile_hero_pearl_white_edges_v2] replaced: {label}")
    return new_text, True


def main() -> None:
    print("[refine_profile_hero_pearl_white_edges_v2] starting")

    if not PROFILE.exists():
        fail(f"Profile file not found: {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    header_marker = "HEADER SECTION"
    grid_marker = "MAIN GRID"

    header_idx = source.find(header_marker)
    grid_idx = source.find(grid_marker)

    if header_idx == -1:
        fail("Could not find HEADER SECTION marker.")
    if grid_idx == -1:
        fail("Could not find MAIN GRID marker.")
    if grid_idx <= header_idx:
        fail("MAIN GRID marker appears before HEADER SECTION. Aborting for safety.")

    header_block = source[header_idx:grid_idx]
    original_header_block = header_block

    for marker in ["ProfilePhotoEditor", "Edit Profile", "handleEditProfile"]:
        if marker not in header_block:
            fail(f"Safety stop: header block missing expected marker: {marker}")

    # 1. Hero wrapper: whiter, softer, less gray.
    header_block, _ = replace_one(
        header_block,
        r'(<div\s+className=")relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-\[2rem\][^"]*(")',
        (
            r'\1relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden '
            r'rounded-[2rem] border border-white/90 bg-white/90 px-6 py-7 text-center '
            r'shadow-[0_18px_50px_rgba(139,92,246,0.06)] backdrop-blur-xl '
            r'dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:px-10 sm:py-9\2'
        ),
        "hero wrapper",
    )

    # 2. Atmospheric overlay: pearl-white center, very faint violet/cyan at edges.
    header_block, _ = replace_one(
        header_block,
        r'<div\s+className="pointer-events-none absolute inset-0 bg-\[radial-gradient\([^"]+\)\]"\s*/>',
        (
            '<div className="pointer-events-none absolute inset-0 '
            'bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.96),'
            'rgba(255,255,255,0.88)_30%,rgba(255,255,255,0.74)_50%,'
            'rgba(245,243,255,0.22)_72%,rgba(236,254,255,0.16)_100%)]" />'
        ),
        "atmospheric radial overlay",
    )

    # 3. Cyan glow: softer.
    header_block, _ = replace_one(
        header_block,
        r'<div\s+className="pointer-events-none absolute -right-[^"]*?bg-cyan-[^"]*?blur-3xl"\s*/>',
        '<div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/8 blur-3xl" />',
        "cyan glow",
    )

    # 4. Violet glow: softer.
    header_block, _ = replace_one(
        header_block,
        r'<div\s+className="pointer-events-none absolute -left-[^"]*?bg-violet-[^"]*?blur-3xl"\s*/>',
        '<div className="pointer-events-none absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-violet-300/8 blur-3xl" />',
        "violet glow",
    )

    # 5. Top sheen: replace if present. If absent, insert it after the violet glow.
    sheen_replacement = (
        '<div className="pointer-events-none absolute inset-x-10 top-0 h-px '
        'bg-gradient-to-r from-transparent via-white/95 to-transparent" />'
    )

    header_block, sheen_found = replace_one(
        header_block,
        r'<div\s+className="pointer-events-none absolute inset-x-[^"]*?top-0 h-px bg-gradient-to-r [^"]*?"\s*/>',
        sheen_replacement,
        "top sheen",
        required=False,
    )

    if not sheen_found:
        violet_glow = '<div className="pointer-events-none absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-violet-300/8 blur-3xl" />'
        if violet_glow not in header_block:
            fail("Could not insert top sheen because the refined violet glow was not found.")
        header_block = header_block.replace(violet_glow, violet_glow + "\n\n          {/* Top sheen */}\n          " + sheen_replacement, 1)
        print("[refine_profile_hero_pearl_white_edges_v2] inserted: top sheen")

    required_after = [
        "border border-white/90",
        "bg-white/90",
        "py-7",
        "sm:py-9",
        "shadow-[0_18px_50px_rgba(139,92,246,0.06)]",
        "rgba(255,255,255,0.96)",
        "rgba(255,255,255,0.88)_30%",
        "rgba(255,255,255,0.74)_50%",
        "rgba(245,243,255,0.22)_72%",
        "rgba(236,254,255,0.16)_100%",
        "bg-cyan-300/8",
        "bg-violet-300/8",
        "via-white/95",
        "ProfilePhotoEditor",
        "Edit Profile",
    ]

    for marker in required_after:
        if marker not in header_block:
            fail(f"Safety check failed. Refined header missing marker: {marker}")

    if header_block == original_header_block:
        fail("No effective changes were made. No changes were written.")

    updated_source = source[:header_idx] + header_block + source[grid_idx:]

    for marker in ["Impact Metrics", "Operational Trust", "Skill Profile", "Behavioral Analysis"]:
        if marker not in updated_source[grid_idx:]:
            fail(f"Safety check failed. Main grid marker missing after patch: {marker}")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = PROFILE.with_name(f"{PROFILE.name}.bak-refine-profile-hero-pearl-white-v2-{timestamp}")
    backup.write_text(original, encoding="utf-8")
    print(f"[refine_profile_hero_pearl_white_edges_v2] backup created: {backup}")

    PROFILE.write_text(updated_source, encoding="utf-8")
    print(f"[refine_profile_hero_pearl_white_edges_v2] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "HEADER SECTION|bg-white/90|border-white/90|radial-gradient|bg-cyan-300/8|bg-violet-300/8|via-white/95|MAIN GRID" src/pages/Profile.jsx -C 8')
    print("  git diff -- src/pages/Profile.jsx")


if __name__ == "__main__":
    main()
