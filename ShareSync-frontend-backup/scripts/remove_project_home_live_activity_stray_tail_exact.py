from pathlib import Path
from datetime import datetime

TARGET = Path("src/pages/ProjectHome.jsx")

MARKER = "PROJECT LIVE ACTIVITY ACTOR BRIDGE"

START_NEEDLES = [
    "\n}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
    "\n}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
]

END_NEEDLES = [
    "\nfunction OverviewContent(",
    "\nconst OverviewContent",
]

def main():
    print("[remove_project_home_live_activity_stray_tail_exact] starting")

    if not TARGET.exists():
        raise SystemExit(
            f"[remove_project_home_live_activity_stray_tail_exact] ERROR: missing {TARGET}"
        )

    text = TARGET.read_text()

    if MARKER not in text:
        raise SystemExit(
            "[remove_project_home_live_activity_stray_tail_exact] ERROR: actor bridge marker not found"
        )

    marker_index = text.find(MARKER)

    stray_start = -1
    matched_start = ""

    for needle in START_NEEDLES:
        found = text.find(needle, marker_index)
        if found != -1:
            stray_start = found
            matched_start = needle
            break

    if stray_start == -1:
        print("[remove_project_home_live_activity_stray_tail_exact] no malformed stray tail found")
        return

    stray_end = -1
    matched_end = ""

    for needle in END_NEEDLES:
        found = text.find(needle, stray_start + len(matched_start))
        if found != -1:
            stray_end = found
            matched_end = needle
            break

    if stray_end == -1:
        raise SystemExit(
            "[remove_project_home_live_activity_stray_tail_exact] ERROR: could not find OverviewContent boundary after stray tail"
        )

    removed = text[stray_start:stray_end]

    if "const items = Array.isArray(activities) ? activities.slice(0, 5) : [];" not in removed:
        raise SystemExit(
            "[remove_project_home_live_activity_stray_tail_exact] ERROR: safety check failed; removal block does not look like the duplicate live activity body"
        )

    updated = text[:stray_start] + "\n}\n" + text[stray_end:]

    forbidden = [
        "}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
        "}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
    ]

    for token in forbidden:
        if token in updated:
            raise SystemExit(
                "[remove_project_home_live_activity_stray_tail_exact] ERROR: forbidden stray tail still present after cleanup"
            )

    if updated.count("function ProjectLiveActivityCard(") != 1:
        raise SystemExit(
            f"[remove_project_home_live_activity_stray_tail_exact] ERROR: expected exactly 1 ProjectLiveActivityCard function, found {updated.count('function ProjectLiveActivityCard(')}"
        )

    if "function OverviewContent(" not in updated:
        raise SystemExit(
            "[remove_project_home_live_activity_stray_tail_exact] ERROR: OverviewContent missing after cleanup"
        )

    if '<ProjectLiveActivityCard activities={liveActivity} project={project} />' not in updated:
        raise SystemExit(
            "[remove_project_home_live_activity_stray_tail_exact] ERROR: expected ProjectLiveActivityCard project prop is missing"
        )

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(
        f".jsx.bak.before-remove-live-activity-stray-tail-exact-{timestamp}"
    )

    backup.write_text(text)
    TARGET.write_text(updated)

    print(f"[remove_project_home_live_activity_stray_tail_exact] backup created: {backup}")
    print("[remove_project_home_live_activity_stray_tail_exact] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print("  nl -ba src/pages/ProjectHome.jsx | sed -n '2015,2045p'")
    print('  rg -n "PROJECT LIVE ACTIVITY ACTOR BRIDGE|function ProjectLiveActivityCard|function OverviewContent|ProjectActivityActorAvatar|ProjectLiveActivityRow|project=\\{project\\}|\\}\\) \\{" src/pages/ProjectHome.jsx -C 6')
    print("  git diff -- src/pages/ProjectHome.jsx")

if __name__ == "__main__":
    main()
