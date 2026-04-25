from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"
BACKUP = ROOT / "src/pages/Profile.jsx.bak-remove-duplicate-recent-ships"

def fail(message):
    print(f"\n[restore_profile_and_remove_old_recent_ships_precise] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[restore_profile_and_remove_old_recent_ships_precise] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    if not BACKUP.exists():
        fail(f"Could not find backup: {BACKUP}")

    source = BACKUP.read_text(encoding="utf-8")
    original_current = PROFILE.read_text(encoding="utf-8")

    required_backup_markers = [
        "ProfilePhotoEditor",
        "userProjects",
        "Recent Ships",
        "const RecentShipsPanel =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Impact Metrics",
    ]

    for marker in required_backup_markers:
        if marker not in source:
            fail(f"Backup is missing expected marker: {marker}. No changes were written.")

    panel_call_idx = source.find("<RecentShipsPanel ships={recentShips} loading={growthLoading} />")
    if panel_call_idx == -1:
        fail("Could not find polished RecentShipsPanel call in backup.")

    wrapper_start = source.rfind("\n      {isOwnProfile && (", 0, panel_call_idx)
    if wrapper_start == -1:
        fail("Could not find polished RecentShipsPanel wrapper start.")

    # Find the old rendered Recent Ships heading immediately before the polished panel.
    old_recent_idx = source.rfind("Recent Ships", 0, wrapper_start)
    if old_recent_idx == -1:
        print("[restore_profile_and_remove_old_recent_ships_precise] No duplicate old Recent Ships heading found. Restoring backup only.")
        patched = source
    else:
        # Do NOT search thousands of characters upward. The old header/container should be close.
        tight_window_start = max(0, old_recent_idx - 1600)
        nearby = source[tight_window_start:old_recent_idx]

        start_candidates = []

        local_markers = [
            "\n      {/* Recent Ships",
            "\n      {isOwnProfile && recentShips",
            "\n      {isOwnProfile && (recentShips",
            "\n      <div className=\"mb-",
            "\n      <section",
        ]

        for marker in local_markers:
            local_idx = nearby.rfind(marker)
            if local_idx != -1:
                start_candidates.append(tight_window_start + local_idx)

        if not start_candidates:
            fail("Could not safely locate the old Recent Ships block start in the tight window. No changes were written.")

        old_block_start = max(start_candidates)

        if old_block_start >= old_recent_idx:
            fail("Calculated old block start is unsafe.")

        removed = source[old_block_start:wrapper_start]

        safety_required_in_removed = [
            "Recent Ships",
        ]

        for marker in safety_required_in_removed:
            if marker not in removed:
                fail(f"Removal range does not contain expected old marker: {marker}")

        dangerous_markers = [
            "ProfilePhotoEditor",
            "userProjects.map",
            "Projects",
            "<RecentShipsPanel ships={recentShips}",
            "Impact Metrics",
        ]

        for marker in dangerous_markers:
            if marker in removed:
                fail(f"Safety stop: removal range includes protected marker: {marker}")

        patched = source[:old_block_start] + "\n" + source[wrapper_start:]

        print("[restore_profile_and_remove_old_recent_ships_precise] removed old duplicate Recent Ships block")
        print("")
        print("Removed preview:")
        print(removed[:500])

    # Final safety checks.
    final_checks = [
        "ProfilePhotoEditor",
        "userProjects",
        "const RecentShipsPanel =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Recent completed work and shipped deliverables",
        "Impact Metrics",
    ]

    for marker in final_checks:
        if marker not in patched:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    profile_body = patched[patched.find("export default function Profile"):]
    polished_calls = profile_body.count("<RecentShipsPanel ships={recentShips} loading={growthLoading} />")

    if polished_calls != 1:
        fail(f"Expected exactly 1 polished RecentShipsPanel call, found {polished_calls}.")

    emergency_backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-before-restore-recent-ships-precise")
    if not emergency_backup.exists():
        emergency_backup.write_text(original_current, encoding="utf-8")
        print(f"[restore_profile_and_remove_old_recent_ships_precise] emergency backup created: {emergency_backup}")

    PROFILE.write_text(patched, encoding="utf-8")
    print(f"[restore_profile_and_remove_old_recent_ships_precise] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProfilePhotoEditor|Projects|Recent Ships|RecentShipsPanel|Impact Metrics\" src/pages/Profile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
