from pathlib import Path
from datetime import datetime
import re
import sys

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-live-momentum-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

changed = 0

# 1) Import buildProjectMomentum
import_line = 'import buildProjectMomentum from "../utils/projectMomentum";'
if import_line not in text:
    anchor = 'import { getStatusColor } from "../utils/statusColor";'
    if anchor not in text:
        raise SystemExit("❌ Could not find statusColor import anchor.")
    text = text.replace(anchor, anchor + "\n" + import_line, 1)
    changed += 1
    print("✅ Added buildProjectMomentum import.")
else:
    print("ℹ️ buildProjectMomentum import already exists.")

# 2) Add projectMomentum prop to OverviewView using a flexible function-signature edit
if "projectMomentum = null" not in text:
    start = text.find("function OverviewView({")
    if start == -1:
        raise SystemExit("❌ Could not find function OverviewView({")

    end = text.find("}) {", start)
    if end == -1:
        raise SystemExit("❌ Could not find end of OverviewView parameter list.")

    text = text[:end] + "  projectMomentum = null,\n" + text[end:]
    changed += 1
    print("✅ Added projectMomentum prop to OverviewView.")
else:
    print("ℹ️ OverviewView already accepts projectMomentum.")

# 3) Make OverviewView prefer live derived momentum over overview.momentum
if "const serverMomentum = overview?.momentum || {};" not in text:
    old = "  const momentum = overview?.momentum || {};"
    new = """  const serverMomentum = overview?.momentum || {};
  const momentum = projectMomentum || serverMomentum;"""
    if old not in text:
        raise SystemExit("❌ Could not find const momentum = overview?.momentum || {};")
    text = text.replace(old, new, 1)
    changed += 1
    print("✅ OverviewView now prefers projectMomentum.")
else:
    print("ℹ️ OverviewView already prefers projectMomentum.")

# 4) Add parent-level derived projectMomentum after projectOnlineCount
if "const projectMomentum = useMemo(() => {" not in text:
    pattern = r"(  const projectOnlineCount = Math\.max\([\s\S]*?\n  \);\n)"
    match = re.search(pattern, text)

    if not match:
        raise SystemExit("❌ Could not find projectOnlineCount block.")

    insertion = match.group(1) + """
  const projectMomentum = useMemo(() => {
    const activitySource = Array.isArray(activity)
      ? activity
      : Array.isArray(activity?.items)
        ? activity.items
        : Array.isArray(overview?.liveActivity)
          ? overview.liveActivity
          : [];

    return buildProjectMomentum({
      project,
      tasks: liveTasks,
      activities: activitySource,
    });
  }, [project, liveTasks, activity, overview?.liveActivity, pulseRefreshKey]);
"""

    text = text[:match.start()] + insertion + text[match.end():]
    changed += 1
    print("✅ Added live projectMomentum calculation.")
else:
    print("ℹ️ projectMomentum calculation already exists.")

# 5) Make header momentum use derived momentum too
if "Number.isFinite(Number(projectMomentum?.score))" not in text:
    pattern = r"  const headerMetrics = \{[\s\S]*?\n  \};\n\n  const projectLifecycleState"
    replacement = """  const headerMetrics = {
    ...metrics,
    momentum:
      Number.isFinite(Number(projectMomentum?.score))
        ? Number(projectMomentum.score)
        : Number.isFinite(Number(overview?.momentum?.score))
          ? Number(overview.momentum.score)
          : metrics?.momentum || 0,
  };

  const projectLifecycleState"""

    if not re.search(pattern, text):
        raise SystemExit("❌ Could not find headerMetrics block.")

    text = re.sub(pattern, replacement, text, count=1)
    changed += 1
    print("✅ Header momentum now uses projectMomentum.")
else:
    print("ℹ️ Header momentum already uses projectMomentum.")

# 6) Pass projectMomentum into OverviewView
if "projectMomentum={projectMomentum}" not in text:
    old = "              projectOnlineCount={projectOnlineCount}"
    new = """              projectOnlineCount={projectOnlineCount}
              projectMomentum={projectMomentum}"""
    if old not in text:
        raise SystemExit("❌ Could not find OverviewView projectOnlineCount prop.")
    text = text.replace(old, new, 1)
    changed += 1
    print("✅ Passed projectMomentum into OverviewView.")
else:
    print("ℹ️ projectMomentum already passed into OverviewView.")

path.write_text(text)

print("")
print(f"✅ Done. Changes made: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "buildProjectMomentum|projectMomentum|serverMomentum|MomentumCard|headerMetrics" src/pages/ProjectHome.jsx -C 8')
