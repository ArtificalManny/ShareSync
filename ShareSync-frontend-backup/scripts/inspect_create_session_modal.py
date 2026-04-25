#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()

CANDIDATES = [
    ROOT / "src/calendar/CreateSessionModal.jsx",
    ROOT / "src/calendar/CreateSessionModal.js",
    ROOT / "src/calendar/CreateSessionModal.tsx",
    ROOT / "src/calendar/CreateSessionModal.ts",
    ROOT / "src/components/calendar/CreateSessionModal.jsx",
    ROOT / "src/components/calendar/CreateSessionModal.js",
    ROOT / "src/components/calendar/CreateSessionModal.tsx",
    ROOT / "src/components/calendar/CreateSessionModal.ts",
]

SEARCH_TOKENS = [
    "CreateSessionModal",
    "Schedule Session",
    "Add title",
    "Save to Rhythm",
    "Focus Time",
    "Meeting",
    "Break",
]


def fail(message):
    print(f"\n[inspect_create_session_modal] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[inspect_create_session_modal] starting")

    found = [path for path in CANDIDATES if path.exists()]

    if not found:
      print("[inspect_create_session_modal] Could not find modal in common paths.")
      print("")
      print("Run this manually:")
      print('  rg -n "CreateSessionModal|Schedule Session|Save to Rhythm|Add title|Focus Time|Meeting|Break" src --glob "!*.bak*"')
      sys.exit(0)

    for path in found:
        print("")
        print(f"[inspect_create_session_modal] found: {path}")

        source = path.read_text(encoding="utf-8", errors="ignore")
        lines = source.splitlines()

        print("")
        print("Matched lines:")
        for i, line in enumerate(lines, start=1):
            if any(token in line for token in SEARCH_TOKENS):
                start = max(1, i - 4)
                end = min(len(lines), i + 8)

                print("")
                print(f"--- context around line {i} ---")
                for line_no in range(start, end + 1):
                    print(f"{line_no:>5}: {lines[line_no - 1]}")

    print("")
    print("[inspect_create_session_modal] done")
    print("")
    print("Next:")
    print("  Paste the output above, or paste the full CreateSessionModal.jsx file.")


if __name__ == "__main__":
    main()
