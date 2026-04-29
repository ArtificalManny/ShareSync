#!/usr/bin/env python3
from pathlib import Path

ROOT = Path.cwd()
SRC = ROOT / "src"

FILES_TO_CHECK = [
    SRC / "App.jsx",
    SRC / "App.tsx",
    SRC / "main.jsx",
    SRC / "main.tsx",
    SRC / "pages/Profile.jsx",
    SRC / "pages/profile/PublicProfile.jsx",
    SRC / "pages/PublicProfile.jsx",
]


def print_header(title):
    print("\n" + "═" * 90)
    print(title)
    print("═" * 90)


def show_file_status(path):
    exists = path.exists()
    print(f"{path.relative_to(ROOT) if path.exists() or str(path).startswith(str(ROOT)) else path}: {'FOUND' if exists else 'missing'}")


def show_matches(label, patterns):
    print_header(label)

    for path in SRC.rglob("*"):
        if not path.is_file():
            continue

        if path.suffix not in [".js", ".jsx", ".ts", ".tsx"]:
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue

        hits = []
        lines = text.splitlines()

        for i, line in enumerate(lines, start=1):
            for pattern in patterns:
                if pattern in line:
                    hits.append((i, line.rstrip()))
                    break

        if hits:
            print(f"\n--- {path.relative_to(ROOT)} ---")
            for line_no, line in hits[:40]:
                print(f"{line_no}: {line}")


def show_context_for_file(path, patterns, radius=8):
    print_header(f"Context scan: {path.relative_to(ROOT) if path.exists() else path}")

    if not path.exists():
        print("missing")
        return

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    printed_ranges = []

    for idx, line in enumerate(lines):
        if any(pattern in line for pattern in patterns):
            start = max(0, idx - radius)
            end = min(len(lines), idx + radius + 1)

            if any(not (end < old_start or start > old_end) for old_start, old_end in printed_ranges):
                continue

            printed_ranges.append((start, end))

            print(f"\n--- lines {start + 1}-{end} ---")
            for j in range(start, end):
                print(f"{j + 1}: {lines[j]}")


def main():
    print_header("Public profile route diagnosis")

    print("\nWorking directory:")
    print(ROOT)

    print("\nImportant files:")
    for path in FILES_TO_CHECK:
        show_file_status(path)

    show_context_for_file(
        SRC / "pages/Profile.jsx",
        [
            "const isPublicRoute",
            'startsWith("/profile/")',
            'startsWith("/u/")',
            "getPublicUser",
            "isOwnProfile",
        ],
    )

    show_context_for_file(
        SRC / "pages/profile/PublicProfile.jsx",
        [
            "PUBLIC PROFILE ROUTE BRIDGE",
            "import Profile",
            "export default",
            "Public Projects",
        ],
    )

    show_context_for_file(
        SRC / "App.jsx",
        [
            "/profile",
            "PublicProfile",
            "Profile",
            "profile/PublicProfile",
            "pages/PublicProfile",
        ],
    )

    show_matches(
        "All route/import/profile-related matches",
        [
            'path="/profile',
            "path='/profile",
            "/profile/:username",
            "/u/:username",
            "PublicProfile",
            "profile/PublicProfile",
            "pages/PublicProfile",
            "pages/Profile",
        ],
    )

    show_matches(
        "Components/files containing the visible public profile UI text",
        [
            "Public Projects",
            "Day Streak",
            "Ships",
            "@realmannyrivas",
        ],
    )

    print_header("Next command to run manually")
    print("git diff -- src/pages/Profile.jsx src/pages/profile/PublicProfile.jsx src/App.jsx")
    print("\nDone. Paste the output from this diagnostic script back into ChatGPT.")


if __name__ == "__main__":
    main()
