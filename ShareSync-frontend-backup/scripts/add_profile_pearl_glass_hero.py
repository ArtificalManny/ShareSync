from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

OLD_OPEN = """      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />"""

NEW_OPEN = """      <section className="relative mb-16 px-4">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-8 text-center shadow-[0_20px_60px_rgba(139,92,246,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20 sm:px-10 sm:py-10">
          {/* Soft atmospheric background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.82),rgba(255,255,255,0.52)_32%,rgba(139,92,246,0.06)_58%,rgba(34,211,238,0.05)_100%)]" />

          {/* Cyan glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

          {/* Violet glow */}
          <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />

          {/* Top sheen */}
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

          {/* Inner content */}
          <div className="relative z-10 flex w-full flex-col items-center">
            <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />"""

OLD_CLOSE = """        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID"""

NEW_CLOSE = """        </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID"""

OLD_EDIT_BUTTON = """          {/* Edit button - Blue action */}
          {isOwnProfile && (
            <button 
              onClick={handleEditProfile}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}"""

NEW_EDIT_BUTTON = """          {/* Edit button - Purple primary action */}
          {isOwnProfile && (
            <button 
              type="button"
              onClick={handleEditProfile}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white border border-violet-300 shadow-xl shadow-violet-500/35 ring-2 ring-violet-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/45 focus:outline-none focus:ring-4 focus:ring-violet-300"
              style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span className="text-white">Edit Profile</span>
            </button>
          )}"""

def fail(message):
    print(f"\n[add_profile_pearl_glass_hero] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[add_profile_pearl_glass_hero] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_before = [
        "HEADER SECTION",
        "ProfilePhotoEditor",
        "Edit button - Blue action",
        "onClick={handleEditProfile}",
        "MAIN GRID",
        "Impact Metrics",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if "bg-white/80 px-6 py-8 text-center shadow-[0_20px_60px_rgba(139,92,246,0.08)]" in source:
        print("[add_profile_pearl_glass_hero] pearl glass hero already appears installed")
        return

    if OLD_OPEN not in source:
        fail("Could not find exact header opening block. No changes were written.")

    if OLD_CLOSE not in source:
        fail("Could not find exact header closing block before MAIN GRID. No changes were written.")

    if OLD_EDIT_BUTTON not in source:
        fail("Could not find exact blue Edit Profile button block. No changes were written.")

    source = source.replace(OLD_OPEN, NEW_OPEN, 1)
    source = source.replace(OLD_EDIT_BUTTON, NEW_EDIT_BUTTON, 1)
    source = source.replace(OLD_CLOSE, NEW_CLOSE, 1)

    required_after = [
        "relative mb-16 px-4",
        "rounded-[2rem]",
        "border border-white/80",
        "bg-white/80",
        "shadow-[0_20px_60px_rgba(139,92,246,0.08)]",
        "backdrop-blur-xl",
        "radial-gradient(circle_at_50%_20%",
        "rgba(255,255,255,0.82)",
        "rgba(139,92,246,0.06)",
        "rgba(34,211,238,0.05)",
        "bg-cyan-300/10",
        "bg-violet-300/10",
        "via-white/90",
        "relative z-10 flex w-full flex-col items-center",
        "Edit button - Purple primary action",
        "backgroundColor: '#7C3AED'",
        "<span className=\"text-white\">Edit Profile</span>",
        "MAIN GRID",
        "Impact Metrics",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    forbidden_after = [
        "Edit button - Blue action",
        "shadow-blue-200",
        "dark:shadow-blue-900/20",
        "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Safety check failed after patch. Old marker still exists: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-pearl-glass-hero-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[add_profile_pearl_glass_hero] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[add_profile_pearl_glass_hero] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"HEADER SECTION|rounded-\\[2rem\\]|bg-white/80|radial-gradient|bg-cyan-300/10|bg-violet-300/10|Edit button|Edit Profile|MAIN GRID\" src/pages/Profile.jsx -C 8")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
