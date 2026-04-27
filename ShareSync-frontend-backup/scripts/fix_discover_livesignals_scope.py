#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/Discover.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_discover_livesignals_scope] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


DERIVED_BLOCK = """  const publicFeedItems = feed.filter((item) => {
    const name = item.user?.displayName || item.user?.username || item.user || '';
    return name !== 'demo' && name !== 'Demo User';
  });

  const publicActivities = formatActivityItems(publicFeedItems);
  const liveSignals = publicFeedItems.length;
  const totalShips = user?.totalShips || user?.ships || 0;
  const streakDays = user?.streakDays || user?.currentStreak || 0;
  const currentLevel = user?.level || 1;
  const currentXp = user?.xp || 0;
"""


def find_matching_function_end(source: str, function_start: int) -> int:
    brace_start = source.find("{", function_start)
    if brace_start == -1:
        fail("Could not find opening brace for Discover function.")

    depth = 0
    for idx in range(brace_start, len(source)):
        char = source[idx]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return idx

    fail("Could not find closing brace for Discover function.")


def main():
    print("[fix_discover_livesignals_scope] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Discover() {",
        "const isMobile = useIsMobile();",
        "const { user } = useAuth();",
        "NetworkStatCard",
        "NetworkPulsePanel",
        "liveSignals",
        "publicActivities",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before fix: {marker}")

    # Remove any existing derived block wherever the bad script placed it.
    if "const publicFeedItems = feed.filter((item) => {" in source:
        pattern = re.compile(
            r"\n?\s*const publicFeedItems = feed\.filter\(\(item\) => \{\n"
            r"\s*const name = item\.user\?\.displayName \|\| item\.user\?\.username \|\| item\.user \|\| '';\n"
            r"\s*return name !== 'demo' && name !== 'Demo User';\n"
            r"\s*\}\);\n\n"
            r"\s*const publicActivities = formatActivityItems\(publicFeedItems\);\n"
            r"\s*const liveSignals = publicFeedItems\.length;\n"
            r"\s*const totalShips = user\?\.totalShips \|\| user\?\.ships \|\| 0;\n"
            r"\s*const streakDays = user\?\.streakDays \|\| user\?\.currentStreak \|\| 0;\n"
            r"\s*const currentLevel = user\?\.level \|\| 1;\n"
            r"\s*const currentXp = user\?\.xp \|\| 0;\n",
            re.MULTILINE,
        )
        source, removed = pattern.subn("\n", source)
        print(f"[fix_discover_livesignals_scope] removed misplaced derived block(s): {removed}")
    else:
        print("[fix_discover_livesignals_scope] no existing derived block found")

    discover_start = source.find("export default function Discover() {")
    if discover_start == -1:
        fail("Could not find Discover function.")

    discover_end = find_matching_function_end(source, discover_start)
    discover_body = source[discover_start:discover_end]

    # Find the LAST return inside Discover, not helper component returns.
    return_matches = list(re.finditer(r"\n  return \(", discover_body))
    if not return_matches:
        fail("Could not find Discover return statement.")

    return_pos_in_body = return_matches[-1].start()
    absolute_return_pos = discover_start + return_pos_in_body

    source = source[:absolute_return_pos] + "\n" + DERIVED_BLOCK + source[absolute_return_pos:]
    print("[fix_discover_livesignals_scope] inserted derived values inside Discover scope")

    # Safety: make sure derived values are after Discover starts and before Discover return.
    discover_start_after = source.find("export default function Discover() {")
    discover_end_after = find_matching_function_end(source, discover_start_after)
    discover_body_after = source[discover_start_after:discover_end_after]

    required_inside = [
        "const publicFeedItems = feed.filter((item) => {",
        "const publicActivities = formatActivityItems(publicFeedItems);",
        "const liveSignals = publicFeedItems.length;",
        "const totalShips = user?.totalShips || user?.ships || 0;",
        "const currentXp = user?.xp || 0;",
    ]

    for marker in required_inside:
        if marker not in discover_body_after:
            fail(f"Safety check failed: marker not inside Discover scope: {marker}")

    # Safety: helper should not contain feed-derived block before Discover.
    before_discover = source[:discover_start_after]
    if "const publicFeedItems = feed.filter((item) => {" in before_discover:
        fail("Safety check failed: publicFeedItems still exists before Discover function.")

    if source == original:
        print("[fix_discover_livesignals_scope] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-fix-livesignals-scope-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_discover_livesignals_scope] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_discover_livesignals_scope] patched: {TARGET}")

    print("")
    print("[fix_discover_livesignals_scope] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"publicFeedItems|publicActivities|liveSignals|totalShips|streakDays|currentLevel|currentXp|return \\(\" src/pages/Discover.jsx -C 6")
    print("  git diff -- src/pages/Discover.jsx")


if __name__ == "__main__":
    main()
