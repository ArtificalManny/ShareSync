#!/usr/bin/env python3
from pathlib import Path

ROOT = Path.cwd()
SRC = ROOT / "src"

FILES = [
    SRC / "App.jsx",
    SRC / "main.jsx",
    SRC / "components/layout/AppLayout.jsx",
    SRC / "components/layout/Layout.jsx",
    SRC / "components/layout/Topbar.jsx",
    SRC / "components/layout/Navbar.jsx",
    SRC / "components/layout/Sidebar.jsx",
    SRC / "components/sidebar/Sidebar.jsx",
    SRC / "components/navigation/Sidebar.jsx",
    SRC / "components/navigation/Topbar.jsx",
    SRC / "pages/Home.jsx",
    SRC / "pages/Profile.jsx",
    SRC / "pages/Discover.jsx",
    SRC / "pages/Settings.jsx",
    SRC / "theme.css",
    SRC / "index.css",
    SRC / "App.css",
]

NEEDLES = [
    "bg-white",
    "bg-slate-50",
    "bg-slate-100",
    "bg-gray-50",
    "bg-gray-100",
    "from-white",
    "via-white",
    "to-white",
    "text-slate-900",
    "text-slate-800",
    "border-slate-200",
    "border-gray-200",
    "backdrop-blur",
    "sidebar",
    "Sidebar",
    "Topbar",
    "Navbar",
    "Header",
    "dark:",
    "min-h-screen",
]


def header(title):
    print("\n" + "═" * 100)
    print(title)
    print("═" * 100)


def read(path):
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def show_context(path, radius=7):
    if not path.exists():
        return

    text = read(path)
    lines = text.splitlines()
    printed = []

    print(f"\n--- {path.relative_to(ROOT)} ---")

    for i, line in enumerate(lines):
        if any(needle in line for needle in NEEDLES):
            start = max(0, i - radius)
            end = min(len(lines), i + radius + 1)

            if any(not (end < old_start or start > old_end) for old_start, old_end in printed):
                continue

            printed.append((start, end))
            print(f"\nlines {start + 1}-{end}")
            for j in range(start, end):
                print(f"{j + 1}: {lines[j]}")


def main():
    header("Global dark-mode shell diagnostic")
    print(f"Root: {ROOT}")

    header("File status")
    for path in FILES:
        print(f"{path.relative_to(ROOT)}: {'FOUND' if path.exists() else 'missing'}")

    header("Focused context")
    for path in FILES:
        show_context(path)

    header("Next step")
    print("Paste this output back into ChatGPT.")
    print("The likely fix is in the shared sidebar/topbar/layout files, not only Settings.jsx.")


if __name__ == "__main__":
    main()
