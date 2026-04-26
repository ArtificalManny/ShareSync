#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/ProjectHome.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message):
    print(f"\n[sync_project_overview_online_count] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-sync-online-count-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[sync_project_overview_online_count] backup created: {backup_path}")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)

    if count != 1:
        fail(f"Expected exactly 1 occurrence for {label}, found {count}. No changes were written.")

    print(f"[sync_project_overview_online_count] replacing: {label}")
    return source.replace(old, new, 1)


def main():
    print("[sync_project_overview_online_count] starting")

    if not TARGET.exists():
        fail(f"Target file not found: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "function OverviewView({",
        "activeUsers={headerActiveUsers}",
        "const headerActiveUsers = Math.max(",
        "const onlineCount =",
        "summary?.ownerSummary?.onlineCount",
        "caption={`${memberCount} member${memberCount === 1 ? \"\" : \"s\"} · ${onlineCount} online now`}",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1. Add projectOnlineCount prop to OverviewView signature.
    old_signature_piece = """function OverviewView({
  project,
  overview,
  metrics,
  sprint,
  loading,
  onObjectiveClick,
  onSprintAction,
  onFinishLineAction,
  onReopenProject,
  isReopeningProject,
}) {"""

    new_signature_piece = """function OverviewView({
  project,
  overview,
  metrics,
  sprint,
  loading,
  onObjectiveClick,
  onSprintAction,
  onFinishLineAction,
  onReopenProject,
  isReopeningProject,
  projectOnlineCount = 0,
}) {"""

    source = replace_once(
        source,
        old_signature_piece,
        new_signature_piece,
        "OverviewView prop signature"
    )

    # 2. Replace OverviewView onlineCount derivation so it prefers shared live presence.
    old_online_block = """  const onlineCount =
    Number.isFinite(Number(summary?.ownerSummary?.onlineCount))
      ? Number(summary.ownerSummary.onlineCount)
      : 0;"""

    new_online_block = """  const onlineCount =
    Number.isFinite(Number(projectOnlineCount))
      ? Number(projectOnlineCount)
      : Number.isFinite(Number(summary?.ownerSummary?.onlineCount))
        ? Number(summary.ownerSummary.onlineCount)
        : 0;"""

    source = replace_once(
        source,
        old_online_block,
        new_online_block,
        "OverviewView onlineCount derivation"
    )

    # 3. Rename the shared computed count from headerActiveUsers to projectOnlineCount.
    old_header_count_block = """  const headerActiveUsers = Math.max(
    Number.isFinite(Number(projectStats?.online)) ? Number(projectStats.online) : 0,
    overviewOnlineCount
  );"""

    new_project_count_block = """  const projectOnlineCount = Math.max(
    Number.isFinite(Number(projectStats?.online)) ? Number(projectStats.online) : 0,
    overviewOnlineCount
  );"""

    source = replace_once(
        source,
        old_header_count_block,
        new_project_count_block,
        "shared projectOnlineCount computation"
    )

    # 4. Pass projectOnlineCount into OverviewView.
    old_overview_view_call = """            <OverviewView
              project={project}
              overview={overview}
              metrics={metrics}
              sprint={sprint}
              loading={loading}
              onObjectiveClick={handleObjectiveClick}
              onSprintAction={handleSprintAction}
              onFinishLineAction={handleFinishLineAction}
              onReopenProject={handleReopenProject}
              isReopeningProject={isReopeningProject}
            />"""

    new_overview_view_call = """            <OverviewView
              project={project}
              overview={overview}
              metrics={metrics}
              sprint={sprint}
              loading={loading}
              onObjectiveClick={handleObjectiveClick}
              onSprintAction={handleSprintAction}
              onFinishLineAction={handleFinishLineAction}
              onReopenProject={handleReopenProject}
              isReopeningProject={isReopeningProject}
              projectOnlineCount={projectOnlineCount}
            />"""

    source = replace_once(
        source,
        old_overview_view_call,
        new_overview_view_call,
        "OverviewView projectOnlineCount prop"
    )

    # 5. Pass the same shared value to ProjectHeader.
    source = replace_once(
        source,
        "        activeUsers={headerActiveUsers}",
        "        activeUsers={projectOnlineCount}",
        "ProjectHeader activeUsers prop"
    )

    required_after = [
        "projectOnlineCount = 0",
        "Number.isFinite(Number(projectOnlineCount))",
        "const projectOnlineCount = Math.max(",
        "projectOnlineCount={projectOnlineCount}",
        "activeUsers={projectOnlineCount}",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if "headerActiveUsers" in source:
        fail("Safety check failed: headerActiveUsers still exists after patch.")

    if source == original:
        fail("No changes detected. No files were written.")

    backup(TARGET)
    TARGET.write_text(source, encoding="utf-8")
    print(f"[sync_project_overview_online_count] patched: {TARGET}")

    print("")
    print("[sync_project_overview_online_count] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "projectOnlineCount|online now|activeUsers=|OverviewView" src/pages/ProjectHome.jsx -C 6')
    print("  git diff -- src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
