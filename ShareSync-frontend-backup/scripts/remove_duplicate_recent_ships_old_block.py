from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[remove_duplicate_recent_ships_old_block] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[remove_duplicate_recent_ships_old_block] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
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

    # Find the old rendered Recent Ships heading immediately before the new polished panel call.
    old_recent_idx = source.rfind("Recent Ships", 0, panel_call_idx)
    if old_recent_idx == -1:
        print("[remove_duplicate_recent_ships_old_block] no earlier Recent Ships heading found before polished panel")
        return

    # Important: ignore the Recent Ships text inside the component definition.
    main_page_idx = source.find("export default function Profile")
    if old_recent_idx < main_page_idx:
        print("[remove_duplicate_recent_ships_old_block] earlier Recent Ships belongs to helper/component definition; no rendered duplicate found")
        return

    # Find the start of the old JSX section by scanning upward from the old heading.
    search_start = max(0, old_recent_idx - 7000)
    candidates = []

    markers = [
        "\n      {/* Recent Ships",
        "\n      {isOwnProfile && recentShips",
        "\n      {isOwnProfile && (recentShips",
        "\n      <section",
        "\n      <div className=\"mb-",
        "\n      <div className='mb-",
    ]

    for marker in markers:
        idx = source.rfind(marker, search_start, old_recent_idx)
        if idx != -1:
            candidates.append(idx)

    if not candidates:
        fail("Could not safely locate the start of the old Recent Ships block. No changes were written.")

    old_block_start = max(candidates)

    # Find the wrapper line that starts the new polished panel call.
    new_call_wrapper_start = source.rfind("\n      {isOwnProfile && (", 0, panel_call_idx)
    if new_call_wrapper_start == -1:
        fail("Could not locate polished RecentShipsPanel wrapper start. No changes were written.")

    if old_block_start >= new_call_wrapper_start:
        fail("Calculated old block range is unsafe. No changes were written.")

    removed = source[old_block_start:new_call_wrapper_start]

    if "Recent Ships" not in removed:
        fail("Safety check failed: removal range does not contain old Recent Ships. No changes were written.")

    if "<RecentShipsPanel ships={recentShips}" in removed:
        fail("Safety check failed: removal range includes polished panel. No changes were written.")

    source = source[:old_block_start] + "\n" + source[new_call_wrapper_start:]

    # After cleanup, rendered Recent Ships should only appear through the polished component call.
    profile_body = source[source.find("export default function Profile"):]
    polished_call_count = profile_body.count("<RecentShipsPanel ships={recentShips} loading={growthLoading} />")

    if polished_call_count != 1:
        fail(f"Safety check failed: expected exactly 1 polished panel call, found {polished_call_count}.")

    if "Recent completed work and shipped deliverables" not in source:
        fail("Safety check failed: polished RecentShipsPanel component text missing after cleanup.")

    if "Impact Metrics" not in source:
        fail("Safety check failed: Impact Metrics marker missing after cleanup.")

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-remove-duplicate-recent-ships")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[remove_duplicate_recent_ships_old_block] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[remove_duplicate_recent_ships_old_block] patched: {PROFILE}")

    print("")
    print("Removed old block preview:")
    print(removed[:600])
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Recent Ships|RecentShipsPanel|recentShips|Impact Metrics\" src/pages/Profile.jsx -C 4")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
