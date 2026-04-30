#!/usr/bin/env python3
from pathlib import Path

ROOT = Path.cwd()
SRC = ROOT / "src"

FILES = [
    SRC / "pages/Settings.jsx",
    SRC / "pages/Settings.tsx",
    SRC / "components/layout/Topbar.jsx",
    SRC / "components/layout/Sidebar.jsx",
    SRC / "components/layout/AppLayout.jsx",
    SRC / "components/layout/Layout.jsx",
    SRC / "components/sidebar/Sidebar.jsx",
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
    "text-slate-900",
    "text-slate-800",
    "text-gray-900",
    "border-slate-200",
    "border-gray-200",
    "shadow",
    "Danger Zone",
    "Appearance",
    "Theme",
    "Save Changes",
    "Export all my data",
    "Delete my account",
    "select",
    "input",
    "button",
    "dark:",
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


def show_file_status():
    header("File status")
    for path in FILES:
        print(f"{path.relative_to(ROOT)}: {'FOUND' if path.exists() else 'missing'}")


def show_context(path, radius=7):
    text = read(path)
    if not text:
        return

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


def scan_src_for_settings_related():
    header("Settings-related light class scan")

    patterns = [
        "Settings",
        "Danger Zone",
        "Appearance",
        "Theme",
        "Export all my data",
        "Delete my account",
        "Save Changes",
    ]

    for path in SRC.rglob("*"):
        if not path.is_file() or path.suffix not in [".js", ".jsx", ".ts", ".tsx", ".css"]:
            continue

        text = read(path)
        if not text:
            continue

        if any(pattern in text for pattern in patterns):
            print(f"\n--- {path.relative_to(ROOT)} ---")
            lines = text.splitlines()
            for i, line in enumerate(lines, start=1):
                if (
                    any(pattern in line for pattern in patterns)
                    or "bg-white" in line
                    or "bg-slate-50" in line
                    or "text-slate-900" in line
                    or "border-slate-200" in line
                    or "dark:" in line
                ):
                    print(f"{i}: {line.rstrip()}")


def main():
    header("Settings dark-mode diagnostic")
    print(f"Root: {ROOT}")

    show_file_status()

    header("Focused file context")
    for path in FILES:
        if path.exists():
            show_context(path)

    scan_src_for_settings_related()

    header("Next step")
    print("Paste this output back into ChatGPT.")
    print("Then we can patch Settings.jsx surgically without touching unrelated pages.")


if __name__ == "__main__":
    main()
