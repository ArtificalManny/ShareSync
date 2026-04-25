from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

REPLACEMENTS = [
    (
        "relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-8 text-center shadow-[0_20px_60px_rgba(139,92,246,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20 sm:px-10 sm:py-10",
        "relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/90 bg-white/90 px-6 py-7 text-center shadow-[0_18px_50px_rgba(139,92,246,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:px-10 sm:py-9",
    ),
    (
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.82),rgba(255,255,255,0.52)_32%,rgba(139,92,246,0.06)_58%,rgba(34,211,238,0.05)_100%)]",
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.96),rgba(255,255,255,0.78)_34%,rgba(245,243,255,0.34)_62%,rgba(236,254,255,0.22)_100%)]",
    ),
    (
        "pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl",
        "pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/8 blur-3xl",
    ),
    (
        "pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl",
        "pointer-events-none absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-violet-300/8 blur-3xl",
    ),
    (
        "pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent",
        "pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent",
    ),
]

def fail(message):
    print(f"\n[refine_profile_hero_to_pearl_white] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[refine_profile_hero_to_pearl_white] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_before = [
        "HEADER SECTION",
        "rounded-[2rem]",
        "backdrop-blur-xl",
        "radial-gradient(circle_at_50%_20%",
        "ProfilePhotoEditor",
        "Edit Profile",
        "MAIN GRID",
        "Impact Metrics",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    changed = False

    for old, new in REPLACEMENTS:
        if old in source:
            source = source.replace(old, new, 1)
            changed = True
            print(f"[refine_profile_hero_to_pearl_white] replaced: {old[:90]}...")
        elif new in source:
            print(f"[refine_profile_hero_to_pearl_white] already refined: {new[:90]}...")
        else:
            fail(
                "Could not find expected current hero styling block. "
                "No changes were written.\n\nMissing block:\n" + old
            )

    required_after = [
        "border border-white/90",
        "bg-white/90",
        "py-7",
        "sm:py-9",
        "shadow-[0_18px_50px_rgba(139,92,246,0.06)]",
        "rgba(255,255,255,0.96)",
        "rgba(255,255,255,0.78)_34%",
        "rgba(245,243,255,0.34)_62%",
        "rgba(236,254,255,0.22)_100%",
        "bg-cyan-300/8",
        "bg-violet-300/8",
        "via-white",
        "ProfilePhotoEditor",
        "Edit Profile",
        "MAIN GRID",
        "Impact Metrics",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    forbidden_after = [
        "bg-white/80 px-6 py-8",
        "shadow-[0_20px_60px_rgba(139,92,246,0.08)]",
        "rgba(255,255,255,0.82)",
        "rgba(139,92,246,0.06)_58%",
        "rgba(34,211,238,0.05)_100%",
        "bg-cyan-300/10",
        "bg-violet-300/10",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Safety check failed after patch. Old heavier hero marker still exists: {marker}")

    if not changed:
        print("[refine_profile_hero_to_pearl_white] no changes needed")
        return

    backup = PROFILE.with_suffix(
        PROFILE.suffix + f".bak-refine-pearl-white-hero-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original, encoding="utf-8")
    print(f"[refine_profile_hero_to_pearl_white] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[refine_profile_hero_to_pearl_white] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"rounded-\\[2rem\\]|bg-white/90|border-white/90|py-7|sm:py-9|shadow-\\[0_18px_50px|rgba\\(255,255,255,0.96\\)|bg-cyan-300/8|bg-violet-300/8|Edit Profile|MAIN GRID\" src/pages/Profile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
