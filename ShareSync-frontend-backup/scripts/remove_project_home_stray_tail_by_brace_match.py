from pathlib import Path
from datetime import datetime

TARGET = Path("src/pages/ProjectHome.jsx")

MARKER = "PROJECT LIVE ACTIVITY ACTOR BRIDGE"

STRAY_NEEDLES = [
    "\n}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
    "\n}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
]

def line_number_at(text, index):
    return text.count("\n", 0, index) + 1

def find_matching_brace(text, open_brace_index):
    depth = 0

    in_single = False
    in_double = False
    in_template = False
    in_line_comment = False
    in_block_comment = False
    escaped = False

    index = open_brace_index

    while index < len(text):
        char = text[index]
        nxt = text[index + 1] if index + 1 < len(text) else ""

        if in_line_comment:
            if char == "\n":
                in_line_comment = False
            index += 1
            continue

        if in_block_comment:
            if char == "*" and nxt == "/":
                in_block_comment = False
                index += 2
                continue
            index += 1
            continue

        if in_single:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "'":
                in_single = False
            index += 1
            continue

        if in_double:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_double = False
            index += 1
            continue

        if in_template:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "`":
                in_template = False
            index += 1
            continue

        if char == "/" and nxt == "/":
            in_line_comment = True
            index += 2
            continue

        if char == "/" and nxt == "*":
            in_block_comment = True
            index += 2
            continue

        if char == "'":
            in_single = True
            index += 1
            continue

        if char == '"':
            in_double = True
            index += 1
            continue

        if char == "`":
            in_template = True
            index += 1
            continue

        if char == "{":
            depth += 1

        elif char == "}":
            depth -= 1

            if depth == 0:
                return index + 1

            if depth < 0:
                raise SystemExit(
                    "[remove_project_home_stray_tail_by_brace_match] ERROR: brace depth went negative"
                )

        index += 1

    raise SystemExit(
        "[remove_project_home_stray_tail_by_brace_match] ERROR: could not find matching closing brace"
    )

def remove_one_stray_tail(text):
    marker_index = text.find(MARKER)

    if marker_index == -1:
        raise SystemExit(
            "[remove_project_home_stray_tail_by_brace_match] ERROR: actor bridge marker not found"
        )

    best_start = -1
    best_needle = ""

    for needle in STRAY_NEEDLES:
        found = text.find(needle, marker_index)

        if found != -1 and (best_start == -1 or found < best_start):
            best_start = found
            best_needle = needle

    if best_start == -1:
        return text, False

    open_brace_index = text.find("{", best_start)

    if open_brace_index == -1:
        raise SystemExit(
            "[remove_project_home_stray_tail_by_brace_match] ERROR: found stray marker but no opening brace"
        )

    close_brace_end = find_matching_brace(text, open_brace_index)

    removed_block = text[best_start:close_brace_end]

    safety_tokens = [
        "const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
        "const hasItems = items.length > 0;",
        "return (",
        "Live Activity",
    ]

    for token in safety_tokens:
        if token not in removed_block:
            raise SystemExit(
                f"[remove_project_home_stray_tail_by_brace_match] ERROR: safety token missing from removal block: {token}"
            )

    start_line = line_number_at(text, best_start)
    end_line = line_number_at(text, close_brace_end)

    print(
        f"[remove_project_home_stray_tail_by_brace_match] removing malformed duplicate block lines {start_line}-{end_line}"
    )

    updated = text[:best_start] + "\n}\n" + text[close_brace_end:]

    return updated, True

def main():
    print("[remove_project_home_stray_tail_by_brace_match] starting")

    if not TARGET.exists():
        raise SystemExit(
            f"[remove_project_home_stray_tail_by_brace_match] ERROR: missing {TARGET}"
        )

    original = TARGET.read_text()
    updated = original

    removal_count = 0

    while True:
        updated, changed = remove_one_stray_tail(updated)

        if not changed:
            break

        removal_count += 1

        if removal_count > 5:
            raise SystemExit(
                "[remove_project_home_stray_tail_by_brace_match] ERROR: removed more than 5 stray tails; stopping for safety"
            )

    if removal_count == 0:
        print("[remove_project_home_stray_tail_by_brace_match] no stray duplicate block found")
        return

    forbidden_tokens = [
        "}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
        "}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
    ]

    for token in forbidden_tokens:
        if token in updated:
            raise SystemExit(
                "[remove_project_home_stray_tail_by_brace_match] ERROR: forbidden stray tail still present after cleanup"
            )

    if updated.count("function ProjectLiveActivityCard(") != 1:
        raise SystemExit(
            f"[remove_project_home_stray_tail_by_brace_match] ERROR: expected exactly 1 ProjectLiveActivityCard function, found {updated.count('function ProjectLiveActivityCard(')}"
        )

    if "function ProjectActivityActorAvatar" not in updated:
        raise SystemExit(
            "[remove_project_home_stray_tail_by_brace_match] ERROR: ProjectActivityActorAvatar missing after cleanup"
        )

    if "function ProjectLiveActivityRow" not in updated:
        raise SystemExit(
            "[remove_project_home_stray_tail_by_brace_match] ERROR: ProjectLiveActivityRow missing after cleanup"
        )

    if '<ProjectLiveActivityCard activities={liveActivity} project={project} />' not in updated:
        raise SystemExit(
            "[remove_project_home_stray_tail_by_brace_match] ERROR: ProjectLiveActivityCard project prop missing after cleanup"
        )

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(
        f".jsx.bak.before-brace-match-live-activity-stray-tail-cleanup-{timestamp}"
    )

    backup.write_text(original)
    TARGET.write_text(updated)

    print(f"[remove_project_home_stray_tail_by_brace_match] backup created: {backup}")
    print(f"[remove_project_home_stray_tail_by_brace_match] removed stray block count: {removal_count}")
    print("[remove_project_home_stray_tail_by_brace_match] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print("  nl -ba src/pages/ProjectHome.jsx | sed -n '2015,2045p'")
    print('  rg -n "PROJECT LIVE ACTIVITY ACTOR BRIDGE|function ProjectLiveActivityCard|ProjectActivityActorAvatar|ProjectLiveActivityRow|project=\\{project\\}|\\}\\) \\{" src/pages/ProjectHome.jsx -C 6')
    print("  git diff -- src/pages/ProjectHome.jsx")

if __name__ == "__main__":
    main()
