from pathlib import Path
from datetime import datetime
import re

TARGET = Path("src/pages/ProjectHome.jsx")

MALFORMED_START_RE = re.compile(
    r"\n\s*\}\)\s*\{\s*\n\s*const items = Array\.isArray\(activities\) \? activities\.slice\(0, 5\) : \[\];"
)

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

    i = open_brace_index

    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""

        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if in_single:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == "'":
                in_single = False
            i += 1
            continue

        if in_double:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_double = False
            i += 1
            continue

        if in_template:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == "`":
                in_template = False
            i += 1
            continue

        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue

        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue

        if ch == "'":
            in_single = True
            i += 1
            continue

        if ch == '"':
            in_double = True
            i += 1
            continue

        if ch == "`":
            in_template = True
            i += 1
            continue

        if ch == "{":
            depth += 1

        elif ch == "}":
            depth -= 1

            if depth == 0:
                return i + 1

            if depth < 0:
                raise SystemExit(
                    "[remove_all_project_home_malformed_live_activity_tails] ERROR: brace depth went negative"
                )

        i += 1

    raise SystemExit(
        "[remove_all_project_home_malformed_live_activity_tails] ERROR: could not find matching closing brace"
    )

def remove_next_malformed_block(text):
    match = MALFORMED_START_RE.search(text)

    if not match:
        return text, False

    start = match.start()
    open_brace = text.find("{", start)

    if open_brace == -1:
        raise SystemExit(
            "[remove_all_project_home_malformed_live_activity_tails] ERROR: malformed block found, but no opening brace found"
        )

    end = find_matching_brace(text, open_brace)
    removed = text[start:end]

    safety_tokens = [
        "const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
        "const hasItems = items.length > 0;",
        "return (",
        "Live Activity",
    ]

    for token in safety_tokens:
        if token not in removed:
            raise SystemExit(
                f"[remove_all_project_home_malformed_live_activity_tails] ERROR: removal safety check failed. Missing token: {token}"
            )

    start_line = line_number_at(text, start)
    end_line = line_number_at(text, end)

    print(
        f"[remove_all_project_home_malformed_live_activity_tails] removing malformed duplicate block lines {start_line}-{end_line}"
    )

    # The malformed block begins with `}) {`.
    # The correct close for the real ProjectLiveActivityCard function is just `}`.
    updated = text[:start] + "\n}\n" + text[end:]

    return updated, True

def main():
    print("[remove_all_project_home_malformed_live_activity_tails] starting")

    if not TARGET.exists():
        raise SystemExit(
            f"[remove_all_project_home_malformed_live_activity_tails] ERROR: missing {TARGET}"
        )

    original = TARGET.read_text()
    updated = original
    removed_count = 0

    while True:
        updated, changed = remove_next_malformed_block(updated)

        if not changed:
            break

        removed_count += 1

        if removed_count > 10:
            raise SystemExit(
                "[remove_all_project_home_malformed_live_activity_tails] ERROR: removed more than 10 malformed blocks. Stopping for safety."
            )

    if removed_count == 0:
        print("[remove_all_project_home_malformed_live_activity_tails] no malformed live activity tails found")
        return

    remaining = list(MALFORMED_START_RE.finditer(updated))
    if remaining:
        lines = [str(line_number_at(updated, m.start())) for m in remaining]
        raise SystemExit(
            "[remove_all_project_home_malformed_live_activity_tails] ERROR: malformed tails still remain on lines: "
            + ", ".join(lines)
        )

    if updated.count("function ProjectLiveActivityCard(") != 1:
        raise SystemExit(
            f"[remove_all_project_home_malformed_live_activity_tails] ERROR: expected exactly 1 ProjectLiveActivityCard function, found {updated.count('function ProjectLiveActivityCard(')}"
        )

    if "function ProjectActivityActorAvatar" not in updated:
        raise SystemExit(
            "[remove_all_project_home_malformed_live_activity_tails] ERROR: ProjectActivityActorAvatar missing after cleanup"
        )

    if "function ProjectLiveActivityRow" not in updated:
        raise SystemExit(
            "[remove_all_project_home_malformed_live_activity_tails] ERROR: ProjectLiveActivityRow missing after cleanup"
        )

    if '<ProjectLiveActivityCard activities={liveActivity} project={project} />' not in updated:
        raise SystemExit(
            "[remove_all_project_home_malformed_live_activity_tails] ERROR: ProjectLiveActivityCard project prop missing after cleanup"
        )

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(
        f".jsx.bak.before-remove-all-malformed-live-activity-tails-{timestamp}"
    )

    backup.write_text(original)
    TARGET.write_text(updated)

    print(f"[remove_all_project_home_malformed_live_activity_tails] backup created: {backup}")
    print(f"[remove_all_project_home_malformed_live_activity_tails] removed malformed block count: {removed_count}")
    print("[remove_all_project_home_malformed_live_activity_tails] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print("  nl -ba src/pages/ProjectHome.jsx | sed -n '2015,2045p'")
    print('  rg -n "\\}\\) \\{|PROJECT LIVE ACTIVITY ACTOR BRIDGE|function ProjectLiveActivityCard|ProjectActivityActorAvatar|ProjectLiveActivityRow|project=\\{project\\}" src/pages/ProjectHome.jsx -C 6')
    print("  git diff -- src/pages/ProjectHome.jsx")

if __name__ == "__main__":
    main()
