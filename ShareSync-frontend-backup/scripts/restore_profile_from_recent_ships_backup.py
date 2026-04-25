from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"
BACKUP = ROOT / "src/pages/Profile.jsx.bak-remove-duplicate-recent-ships"

def fail(message):
    print(f"\n[restore_profile_from_recent_ships_backup] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[restore_profile_from_recent_ships_backup] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    if not BACKUP.exists():
        fail(f"Could not find backup file: {BACKUP}")

    current = PROFILE.read_text(encoding="utf-8")
    restored = BACKUP.read_text(encoding="utf-8")

    required = [
        "ProfilePhotoEditor",
        "userProjects",
        "Recent Ships",
        "const RecentShipsPanel =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Impact Metrics",
    ]

    for marker in required:
        if marker not in restored:
            fail(f"Backup is missing required marker: {marker}. Restore stopped.")

    emergency = PROFILE.with_suffix(PROFILE.suffix + f".bak-damaged-before-restore-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    emergency.write_text(current, encoding="utf-8")
    print(f"[restore_profile_from_recent_ships_backup] emergency backup created: {emergency}")

    PROFILE.write_text(restored, encoding="utf-8")
    print(f"[restore_profile_from_recent_ships_backup] restored: {PROFILE}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProfilePhotoEditor|Projects|Recent Ships|RecentShipsPanel|Impact Metrics\" src/pages/Profile.jsx -C 8")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
