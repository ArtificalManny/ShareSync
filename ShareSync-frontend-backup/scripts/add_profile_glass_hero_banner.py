from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

OLD_OPEN = """      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />"""

NEW_OPEN = """      <section className="relative mb-16 px-4">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 px-6 py-12 shadow-xl shadow-violet-100/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_25%_25%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(135deg,rgba(139,92,246,0.10),rgba(59,130,246,0.06),rgba(45,212,191,0.08))]" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />

          <div className="relative z-10 flex w-full flex-col items-center">
            <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />"""

OLD_CLOSE = """        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR — Compact social proof"""

NEW_CLOSE = """          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR — Compact social proof"""

def fail(message):
    print(f"\\n[add_profile_glass_hero_banner] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[add_profile_glass_hero_banner] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "HEADER SECTION",
        "ProfilePhotoEditor",
        "Edit Profile",
        "STATS BAR — Compact social proof",
        "PROJECT PORTFOLIO",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if "max-w-5xl flex-col items-center overflow-hidden rounded-[2rem]" in source:
        print("[add_profile_glass_hero_banner] glass hero banner already appears to be installed")
        return

    if OLD_OPEN not in source:
        fail("Could not find exact header section opening. No changes were written.")

    if OLD_CLOSE not in source:
        fail("Could not find exact header section closing before stats bar. No changes were written.")

    source = source.replace(OLD_OPEN, NEW_OPEN, 1)
    source = source.replace(OLD_CLOSE, NEW_CLOSE, 1)

    required_after = [
        "rounded-[2rem]",
        "backdrop-blur-xl",
        "radial-gradient(circle_at_50%_12%",
        "bg-cyan-300/20",
        "bg-violet-400/20",
        "relative z-10 flex w-full flex-col items-center",
        "ProfilePhotoEditor",
        "Edit Profile",
        "STATS BAR — Compact social proof",
        "PROJECT PORTFOLIO",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-profile-glass-hero-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[add_profile_glass_hero_banner] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[add_profile_glass_hero_banner] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"HEADER SECTION|rounded-\\[2rem\\]|backdrop-blur-xl|radial-gradient|ProfilePhotoEditor|Edit Profile|STATS BAR|PROJECT PORTFOLIO\" src/pages/Profile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
