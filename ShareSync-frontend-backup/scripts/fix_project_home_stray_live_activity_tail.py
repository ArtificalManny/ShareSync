from pathlib import Path
from datetime import datetime

TARGET = Path("src/pages/ProjectHome.jsx")

MARKER = "PROJECT LIVE ACTIVITY ACTOR BRIDGE"

STRAY_START_NEEDLE = "\n}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];"
ALT_STRAY_START_NEEDLE = "\n}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];"

def find_matching_body_end(text, open_brace_index):
    depth = 0
    in_single = False
    in_double = False
    in_template = False
    in_line_comment = False
    in_block_comment = False
    escaped = False

    for index in range(open_brace_index, len(text)):
        char = text[index]
        nxt = text[index + 1] if index + 1 < len(text) else ""

        if in_line_comment:
            if char == "\n":
                in_line_comment = False
            continue

        if in_block_comment:
            if char == "*" and nxt == "/":
                in_block_comment = False
            continue

        if in_single:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "'":
                in_single = False
            continue

        if in_double:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_double = False
            continue

        if in_template:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "`":
                in_template = False
            continue

        if char == "/" and nxt == "/":
            in_line_comment = True
            continue

        if char == "/" and nxt == "*":
            in_block_comment = True
            continue

        if char == "'":
            in_single = True
            continue

        if char == '"':
            in_double = True
            continue

        if char == "`":
            in_template = True
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1

    raise SystemExit("[fix_project_home_stray_live_activity_tail] ERROR: could not find matching closing brace for stray old component body")

def main():
    print("[fix_project_home_stray_live_activity_tail] starting")

    if not TARGET.exists():
        raise SystemExit(f"[fix_project_home_stray_live_activity_tail] ERROR: missing {TARGET}")

    text = TARGET.read_text()

    if MARKER not in text:
        raise SystemExit(
            "[fix_project_home_stray_live_activity_tail] ERROR: actor bridge marker not found. "
            "This script expects the previous patch to be present."
        )

    marker_index = text.find(MARKER)

    stray_index = text.find(STRAY_START_NEEDLE, marker_index)
    if stray_index == -1:
        stray_index = text.find(ALT_STRAY_START_NEEDLE, marker_index)

    if stray_index == -1:
        print("[fix_project_home_stray_live_activity_tail] no stray tail found")
        return

    body_open = text.find("{", stray_index)
    if body_open == -1:
        raise SystemExit("[fix_project_home_stray_live_activity_tail] ERROR: could not find stray body opening brace")

    body_end = find_matching_body_end(text, body_open)

    updated = text[:stray_index] + "\n" + text[body_end:]

    if "}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];" in updated:
        raise SystemExit("[fix_project_home_stray_live_activity_tail] ERROR: stray tail still present after patch")

    if "}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];" in updated:
        raise SystemExit("[fix_project_home_stray_live_activity_tail] ERROR: alternate stray tail still present after patch")

    if updated.count("function ProjectLiveActivityCard(") != 1:
        raise SystemExit(
            f"[fix_project_home_stray_live_activity_tail] ERROR: expected exactly 1 ProjectLiveActivityCard function, found {updated.count('function ProjectLiveActivityCard(')}"
        )

    if '<ProjectLiveActivityCard activities={liveActivity} project={project} />' not in updated:
        raise SystemExit(
            "[fix_project_home_stray_live_activity_tail] ERROR: expected ProjectLiveActivityCard invocation with project prop"
        )

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".jsx.bak.before-remove-stray-live-activity-tail-{timestamp}")
    backup.write_text(text)
    TARGET.write_text(updated)

    print(f"[fix_project_home_stray_live_activity_tail] backup created: {backup}")
    print("[fix_project_home_stray_live_activity_tail] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT LIVE ACTIVITY ACTOR BRIDGE|function ProjectLiveActivityCard|ProjectActivityActorAvatar|ProjectLiveActivityRow|project=\\{project\\}|\\}\\) \\{" src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/ProjectHome.jsx")

if __name__ == "__main__":
    main()
