#!/usr/bin/env python3
from pathlib import Path

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/Home.jsx"

NEEDLES = [
    "sectionCardClasses",
    "Section card",
    "const StatCard",
    "bg-white dark:bg",
    "dark:bg-[#1f1f23]",
    "home-page",
    "PulseCheckPrompt",
    "<style>",
    "<style>{`",
    "@keyframes",
    "Good",
    "text-violet-600",
]

def print_context(lines, index, radius=10):
    start = max(0, index - radius)
    end = min(len(lines), index + radius + 1)
    print(f"\n--- lines {start + 1}-{end} ---")
    for i in range(start, end):
        print(f"{i + 1}: {lines[i]}")

def main():
    if not TARGET.exists():
        print(f"Missing file: {TARGET}")
        return

    text = TARGET.read_text(encoding="utf-8")
    lines = text.splitlines()

    print(f"[inspect_home_darkmode_anchors] File: {TARGET}")
    print(f"[inspect_home_darkmode_anchors] Total lines: {len(lines)}")

    for needle in NEEDLES:
        print("\n" + "=" * 100)
        print(f"SEARCH: {needle!r}")
        print("=" * 100)

        matches = []
        for i, line in enumerate(lines):
            if needle in line:
                matches.append(i)

        print(f"Matches: {len(matches)}")

        for index in matches[:8]:
            print_context(lines, index, radius=8)

    print("\n" + "=" * 100)
    print("RAW COUNTS")
    print("=" * 100)
    for needle in NEEDLES:
        print(f"{needle!r}: {text.count(needle)}")

if __name__ == "__main__":
    main()
