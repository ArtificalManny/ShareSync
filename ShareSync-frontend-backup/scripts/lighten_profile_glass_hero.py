from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

REPLACEMENTS = [
    (
        "relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 px-6 py-12 shadow-xl shadow-violet-100/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 sm:px-10 sm:py-14",
        "relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 px-6 py-10 shadow-xl shadow-violet-100/35 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:px-10 sm:py-12",
    ),
    (
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_25%_25%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(135deg,rgba(139,92,246,0.10),rgba(59,130,246,0.06),rgba(45,212,191,0.08))]",
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,0.10),transparent_34%),radial-gradient(circle_at_25%_24%,rgba(14,165,233,0.07),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.58),rgba(245,243,255,0.34),rgba(236,254,255,0.28))]",
    ),
    (
        "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl",
        "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl",
    ),
    (
        "pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl",
        "pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-400/12 blur-3xl",
    ),
    (
        "pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent",
        "pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/45 to-transparent",
    ),
]

def fail(message):
    print(f"\n[lighten_profile_glass_hero] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[lighten_profile_glass_hero] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "HEADER SECTION",
        "rounded-[2rem]",
        "backdrop-blur-xl",
        "radial-gradient(circle_at_50%",
        "ProfilePhotoEditor",
        "Edit Profile",
        "STATS BAR — Compact social proof",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    changed = False

    for old, new in REPLACEMENTS:
        if old in source:
            source = source.replace(old, new, 1)
            changed = True
            print(f"[lighten_profile_glass_hero] replaced: {old[:80]}...")
        elif new in source:
            print(f"[lighten_profile_glass_hero] already updated: {new[:80]}...")
        else:
            fail(f"Could not find expected hero styling block:\n{old}\n\nNo changes were written.")

    required_after = [
        "bg-white/75",
        "py-10",
        "sm:py-12",
        "shadow-violet-100/35",
        "rgba(139,92,246,0.10)",
        "rgba(14,165,233,0.07)",
        "rgba(255,255,255,0.58)",
        "bg-cyan-300/12",
        "bg-violet-400/12",
        "via-violet-300/45",
        "ProfilePhotoEditor",
        "Edit Profile",
        "STATS BAR — Compact social proof",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if not changed:
        print("[lighten_profile_glass_hero] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-lighten-profile-glass-hero-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[lighten_profile_glass_hero] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[lighten_profile_glass_hero] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"rounded-\\[2rem\\]|bg-white/75|py-10|sm:py-12|shadow-violet-100/35|rgba\\(139,92,246,0.10\\)|bg-cyan-300/12|bg-violet-400/12|STATS BAR\" src/pages/Profile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
