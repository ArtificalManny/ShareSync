from pathlib import Path
import sys

PROFILE = Path("src/pages/Profile.jsx")

def main():
    if not PROFILE.exists():
        print(f"ERROR: Could not find {PROFILE}", file=sys.stderr)
        sys.exit(1)

    lines = PROFILE.read_text(encoding="utf-8").splitlines()
    matches = [i for i, line in enumerate(lines) if "Edit Profile" in line]

    if not matches:
        print("No Edit Profile text found.")
        return

    for match in matches:
        start = max(0, match - 30)
        end = min(len(lines), match + 30)

        print("=" * 90)
        print(f"Edit Profile match around line {match + 1}")
        print("=" * 90)

        for i in range(start, end):
            print(f"{i + 1:04d}: {lines[i]}")

if __name__ == "__main__":
    main()
