#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()
HOME = ROOT / "src/pages/Home.jsx"
CLOCK = ROOT / "src/components/home/MissionClock.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message):
    print(f"\n[replace_mission_control_with_clock] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-mission-clock-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[replace_mission_control_with_clock] backup created: {backup_path}")


def ensure_import(source: str) -> str:
    if 'MissionClock' in source and 'components/home/MissionClock' in source:
        print("[replace_mission_control_with_clock] MissionClock import already exists")
        return source

    # Prefer placing it near other home component imports if possible.
    import_line = 'import MissionClock from "../components/home/MissionClock";\n'

    home_import_pattern = re.compile(
        r'(import\s+[^;\n]+from\s+["\']\.\./components/home/[^"\']+["\'];\n)'
    )

    matches = list(home_import_pattern.finditer(source))
    if matches:
        last = matches[-1]
        insert_at = last.end()
        print("[replace_mission_control_with_clock] inserted MissionClock near home component imports")
        return source[:insert_at] + import_line + source[insert_at:]

    # Fallback: insert after the last import line at the top of the file.
    generic_import_pattern = re.compile(r'^(import\s+.*?;\n)', re.MULTILINE)
    generic_matches = list(generic_import_pattern.finditer(source))

    if not generic_matches:
        fail("Could not find import section in Home.jsx. No changes were written.")

    last = generic_matches[-1]
    insert_at = last.end()
    print("[replace_mission_control_with_clock] inserted MissionClock after import section")
    return source[:insert_at] + import_line + source[insert_at:]


def replace_mission_control(source: str) -> str:
    if "<MissionClock />" in source:
        print("[replace_mission_control_with_clock] <MissionClock /> already exists")
        return source

    # Exact common JSX pattern:
    exact = '<p className="text-slate-500 dark:text-zinc-400">Mission Control</p>'
    replacement = '<MissionClock />'

    if exact in source:
        print("[replace_mission_control_with_clock] replaced exact Mission Control paragraph")
        return source.replace(exact, replacement, 1)

    # More flexible pattern for:
    # <p className="...">
    #   Mission Control
    # </p>
    flexible_pattern = re.compile(
        r'<p\s+className=(["\'])(?P<class>[^"\']*)\1\s*>\s*Mission Control\s*</p>',
        re.DOTALL,
    )

    match = flexible_pattern.search(source)
    if match:
        print("[replace_mission_control_with_clock] replaced flexible Mission Control paragraph")
        return source[:match.start()] + replacement + source[match.end():]

    # Even safer fallback: replace only the text if it is inside JSX nearby.
    if "Mission Control" in source:
        fail(
            "Found text 'Mission Control' but could not safely identify its JSX wrapper. "
            "No changes were written. Run: rg -n \"Mission Control\" src/pages/Home.jsx -C 8"
        )

    fail("Could not find 'Mission Control' in Home.jsx. No changes were written.")


def main():
    print("[replace_mission_control_with_clock] starting")

    if not HOME.exists():
        fail(f"Missing Home.jsx: {HOME}")

    if not CLOCK.exists():
        fail(f"Missing MissionClock.jsx: {CLOCK}")

    source = HOME.read_text(encoding="utf-8")
    original = source

    required_before = [
        "Home",
        "Good afternoon",
        "Mission Control",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    source = ensure_import(source)
    source = replace_mission_control(source)

    required_after = [
        'import MissionClock from "../components/home/MissionClock";',
        "<MissionClock />",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[replace_mission_control_with_clock] no changes needed")
        return

    backup(HOME)
    HOME.write_text(source, encoding="utf-8")
    print(f"[replace_mission_control_with_clock] patched: {HOME}")

    print("")
    print("[replace_mission_control_with_clock] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "MissionClock|Mission Control|Good afternoon" src/pages/Home.jsx -C 6')
    print("  git diff -- src/pages/Home.jsx")


if __name__ == "__main__":
    main()
