from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

NEW_HEADER = """      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative mb-16 px-4">
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
            <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
            
            <div className="mt-8 text-center">
              <h1 className="mb-3 text-4xl font-semibold text-slate-800 dark:text-white">
                {name.fullName || user?.email?.split('@')[0] || 'Loading...'}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm text-slate-500 dark:text-zinc-400">
                  ID: {user?.username || user?.handle || user?.email?.split('@')[0] || user?._id?.slice(-8) || "..."}
                </span>
                
                {/* Core Verified Badge - Teal (#2DD4BF) */}
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm shadow-teal-500/20"
                  style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Core Verified
                </span>
                
                {skillProfile?.archetype?.current && (
                  <span className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400">
                    <Star className="h-3.5 w-3.5" />
                    {skillProfile.archetype.current}
                  </span>
                )}
              </div>
              
              {user?.bio && (
                <p className="mx-auto mt-6 max-w-lg leading-relaxed text-slate-600 dark:text-zinc-300">
                  {user.bio}
                </p>
              )}
              
              {/* Edit button - Purple primary action */}
              {isOwnProfile && (
                <button 
                  type="button"
                  onClick={handleEditProfile}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-violet-300 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/35 ring-2 ring-violet-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/45 focus:outline-none focus:ring-4 focus:ring-violet-300"
                  style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                >
                  <Edit3 className="h-4 w-4 text-white" />
                  <span className="text-white">Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

"""

def fail(message):
    print(f"\\n[replace_profile_header_with_pearl_glass] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[replace_profile_header_with_pearl_glass] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    header_start_marker = "      {/* ═══════════════════════════════════════════════════════════════════\n          HEADER SECTION"
    main_grid_marker = "      {/* ═══════════════════════════════════════════════════════════════════\n          MAIN GRID"

    start = source.find(header_start_marker)
    if start == -1:
        fail("Could not find HEADER SECTION marker. No changes were written.")

    end = source.find(main_grid_marker, start)
    if end == -1:
        fail("Could not find MAIN GRID marker after HEADER SECTION. No changes were written.")

    old_header = source[start:end]

    required_old = [
        "ProfilePhotoEditor",
        "handleEditProfile",
        "Edit Profile",
        "Core Verified",
        "skillProfile?.archetype?.current",
    ]

    for marker in required_old:
        if marker not in old_header:
            fail(f"Safety stop: old header block missing expected marker: {marker}. No changes were written.")

    protected_outside_header = source[end:]

    for marker in ["Impact Metrics", "Operational Trust", "Skill Profile", "Behavioral Analysis"]:
        if marker not in protected_outside_header:
            fail(f"Safety stop: marker not found after header: {marker}. No changes were written.")

    patched = source[:start] + NEW_HEADER + source[end:]

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
        "ProfilePhotoEditor",
        "handleEditProfile",
        "backgroundColor: '#7C3AED'",
        "<span className=\"text-white\">Edit Profile</span>",
        "MAIN GRID",
        "Impact Metrics",
    ]

    for marker in required_after:
        if marker not in patched:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    # Only forbid the old profile-header blue button inside the new header area.
    new_header_start = patched.find("HEADER SECTION")
    new_header_end = patched.find(main_grid_marker, new_header_start)
    new_header = patched[new_header_start:new_header_end]

    forbidden_in_new_header = [
        "Edit button - Blue action",
        "shadow-blue-200",
        "dark:shadow-blue-900/20",
        "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    ]

    for marker in forbidden_in_new_header:
        if marker in new_header:
            fail(f"Safety check failed. Old header marker still exists: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-before-pearl-glass-header-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[replace_profile_header_with_pearl_glass] backup created: {backup}")

    PROFILE.write_text(patched, encoding="utf-8")
    print(f"[replace_profile_header_with_pearl_glass] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"HEADER SECTION|rounded-\\[2rem\\]|bg-white/80|radial-gradient|bg-cyan-300/10|bg-violet-300/10|Edit button|Edit Profile|MAIN GRID\" src/pages/Profile.jsx -C 8")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
