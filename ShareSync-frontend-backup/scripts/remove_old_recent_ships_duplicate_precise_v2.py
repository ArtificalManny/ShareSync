from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[remove_old_recent_ships_duplicate_precise_v2] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[remove_old_recent_ships_duplicate_precise_v2] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "ProfilePhotoEditor",
        "userProjects",
        "const RecentShipsPanel =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Recent completed work and shipped deliverables",
        "Impact Metrics",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before cleanup: {marker}. No changes were written.")

    panel_call_idx = source.find("<RecentShipsPanel ships={recentShips} loading={growthLoading} />")
    if panel_call_idx == -1:
        fail("Could not find polished RecentShipsPanel render call. No changes were written.")

    polished_wrapper_start = source.rfind("\n      {isOwnProfile && (", 0, panel_call_idx)
    if polished_wrapper_start == -1:
        fail("Could not find polished RecentShipsPanel wrapper start. No changes were written.")

    main_page_idx = source.find("export default function Profile")
    if main_page_idx == -1:
        fail("Could not find Profile component start. No changes were written.")

    search_region = source[main_page_idx:polished_wrapper_start]

    # Find the old rendered block that directly depends on recentShips.
    # This intentionally avoids generic <div>/<section> anchors because those removed too much before.
    old_block_pattern = re.compile(
        r'\n(?P<indent>\s*)\{isOwnProfile\s*&&\s*\(?\s*recentShips(?:\?\.|\.)length\s*>\s*0\s*&&\s*\([\s\S]*?\n(?P=indent)\)\}\s*',
        re.MULTILINE,
    )

    matches = list(old_block_pattern.finditer(search_region))

    if not matches:
        print("[remove_old_recent_ships_duplicate_precise_v2] Could not find old recentShips conditional block.")
        print("")
        print("Debug context before polished panel:")
        context_start = max(0, polished_wrapper_start - 3000)
        print(source[context_start:polished_wrapper_start])
        fail("No changes were written. Paste the debug context if this fails.")

    match = matches[-1]
    old_block_start = main_page_idx + match.start()
    old_block_end = main_page_idx + match.end()
    removed = source[old_block_start:old_block_end]

    safety_required = [
        "Recent Ships",
        "recentShips",
    ]

    for marker in safety_required:
        if marker not in removed:
            fail(f"Safety check failed: removal range does not contain {marker}. No changes were written.")

    protected = [
        "ProfilePhotoEditor",
        "userProjects.map",
        "Projects",
        "<RecentShipsPanel ships={recentShips}",
        "Impact Metrics",
    ]

    for marker in protected:
        if marker in removed:
            fail(f"Safety stop: removal range includes protected marker: {marker}. No changes were written.")

    patched = source[:old_block_start] + "\n" + source[old_block_end:]

    profile_body = patched[main_page_idx:]
    polished_calls = profile_body.count("<RecentShipsPanel ships={recentShips} loading={growthLoading} />")

    if polished_calls != 1:
        fail(f"Expected exactly 1 polished panel call after cleanup, found {polished_calls}. No changes were written.")

    final_required = [
        "ProfilePhotoEditor",
        "userProjects",
        "const RecentShipsPanel =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Recent completed work and shipped deliverables",
        "Impact Metrics",
    ]

    for marker in final_required:
        if marker not in patched:
            fail(f"Safety check failed after cleanup. Missing marker: {marker}. No changes were written.")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-before-remove-old-recent-ships-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[remove_old_recent_ships_duplicate_precise_v2] backup created: {backup}")

    PROFILE.write_text(patched, encoding="utf-8")
    print(f"[remove_old_recent_ships_duplicate_precise_v2] patched: {PROFILE}")

    print("")
    print("Removed old duplicate block preview:")
    print(removed[:700])
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProfilePhotoEditor|Projects|Recent Ships|RecentShipsPanel|Impact Metrics\" src/pages/Profile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
