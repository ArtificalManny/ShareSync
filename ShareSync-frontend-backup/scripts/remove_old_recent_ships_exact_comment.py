from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[remove_old_recent_ships_exact_comment] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[remove_old_recent_ships_exact_comment] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    start_marker = """      {/* ═══════════════════════════════════════════════════════════════════
          RECENT SHIPS — Proof of work
      ═══════════════════════════════════════════════════════════════════ */}
      {recentShips.length > 0 && (
"""

    end_marker = """      {isOwnProfile && (
        <RecentShipsPanel ships={recentShips} loading={growthLoading} />
      )}
"""

    if start_marker not in source:
        fail("Could not find exact old Recent Ships start marker. No changes were written.")

    if end_marker not in source:
        fail("Could not find polished RecentShipsPanel marker. No changes were written.")

    start = source.find(start_marker)
    end = source.find(end_marker, start)

    if end == -1:
        fail("Could not find polished RecentShipsPanel after old Recent Ships block. No changes were written.")

    removed = source[start:end]

    required_in_removed = [
        "RECENT SHIPS — Proof of work",
        "{recentShips.length > 0 && (",
        "{recentShips.map(task => (",
        "<h3 className=\"text-sm font-medium text-slate-600 dark:text-zinc-300\">Recent Ships</h3>",
    ]

    for marker in required_in_removed:
        if marker not in removed:
            fail(f"Removal range missing expected marker: {marker}. No changes were written.")

    protected = [
        "ProfilePhotoEditor",
        "userProjects.map",
        "Projects",
        "<RecentShipsPanel ships={recentShips}",
        "Impact Metrics",
        "Skill Profile",
    ]

    for marker in protected:
        if marker in removed:
            fail(f"Safety stop: removal range includes protected marker: {marker}. No changes were written.")

    patched = source[:start] + "\n" + source[end:]

    final_required = [
        "ProfilePhotoEditor",
        "userProjects.map",
        "Projects",
        "const RecentShipsPanel =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Recent completed work and shipped deliverables",
        "Impact Metrics",
    ]

    for marker in final_required:
        if marker not in patched:
            fail(f"Safety check failed after cleanup. Missing marker: {marker}. No changes were written.")

    profile_body_start = patched.find("export default function Profile")
    if profile_body_start == -1:
        fail("Could not find Profile component after patch. No changes were written.")

    profile_body = patched[profile_body_start:]

    if profile_body.count("<RecentShipsPanel ships={recentShips} loading={growthLoading} />") != 1:
        fail("Expected exactly one polished RecentShipsPanel call after cleanup. No changes were written.")

    if "RECENT SHIPS — Proof of work" in profile_body:
        fail("Old Recent Ships proof-of-work marker still exists after cleanup. No changes were written.")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-before-remove-old-recent-ships-exact-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[remove_old_recent_ships_exact_comment] backup created: {backup}")

    PROFILE.write_text(patched, encoding="utf-8")
    print(f"[remove_old_recent_ships_exact_comment] patched: {PROFILE}")

    print("")
    print("Removed duplicate old Recent Ships block preview:")
    print(removed[:900])
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"RECENT SHIPS|Recent Ships|RecentShipsPanel|ProfilePhotoEditor|Projects|Impact Metrics\" src/pages/Profile.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
