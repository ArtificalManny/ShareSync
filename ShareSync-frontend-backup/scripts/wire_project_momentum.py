from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-live-momentum-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

changed = 0

# 1) Add import
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

# 2) Allow OverviewView to receive derived projectMomentum
old_sig = """  isReopeningProject,
  isStartingSprint = false,
  projectOnlineCount = 0,
}) {"""

new_sig = """  isReopeningProject,
  isStartingSprint = false,
  projectOnlineCount = 0,
  projectMomentum = null,
}) {"""

if old_sig in text:
    text = text.replace(old_sig, new_sig, 1)
    changed += 1
    print("✅ Added projectMomentum prop to OverviewView.")
elif "projectMomentum = null" in text:
    print("ℹ️ OverviewView already accepts projectMomentum.")
else:
    raise SystemExit("❌ Could not update OverviewView signature.")

# 3) Replace stale overview momentum usage inside OverviewView
old_momentum = """  const momentum = overview?.momentum || {};"""
new_momentum = """  const serverMomentum = overview?.momentum || {};
  const momentum = projectMomentum || serverMomentum;"""

if old_momentum in text:
    text = text.replace(old_momentum, new_momentum, 1)
    changed += 1
    print("✅ OverviewView now prefers live derived momentum.")
elif "const serverMomentum = overview?.momentum || {};" in text:
    print("ℹ️ OverviewView already prefers live derived momentum.")
else:
    raise SystemExit("❌ Could not find stale momentum line in OverviewView.")

# 4) Create projectMomentum in parent ProjectHome from liveTasks + activity
if "const projectMomentum = useMemo(() => {" not in text:
    pattern = r"(  const projectOnlineCount = Math\.max\([\s\S]*?\n  \);\n)"
    match = re.search(pattern, text)

    if not match:
        raise SystemExit("❌ Could not find projectOnlineCount block.")

    insertion = r"""\1
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
    text = re.sub(pattern, insertion, text, count=1)
    changed += 1
    print("✅ Added parent-level live projectMomentum calculation.")
else:
    print("ℹ️ projectMomentum calculation already exists.")

# 5) Make ProjectHeader use derived momentum too
header_pattern = r"""  const headerMetrics = \{
    \.\.\.metrics,
    momentum:
      Number\.isFinite\(Number\(overview\?\.momentum\?\.score\)\)
        \? Number\(overview\.momentum\.score\)
        : metrics\?\.momentum \|\| 0,
  \};"""

header_new = """  const headerMetrics = {
    ...metrics,
    momentum:
      Number.isFinite(Number(projectMomentum?.score))
        ? Number(projectMomentum.score)
        : Number.isFinite(Number(overview?.momentum?.score))
          ? Number(overview.momentum.score)
          : metrics?.momentum || 0,
  };"""

if re.search(header_pattern, text):
    text = re.sub(header_pattern, header_new, text, count=1)
    changed += 1
    print("✅ Header momentum now uses live derived momentum.")
elif "Number.isFinite(Number(projectMomentum?.score))" in text:
    print("ℹ️ Header momentum already uses projectMomentum.")
else:
    print("⚠️ Could not find exact headerMetrics block. Skipping header polish.")

# 6) Pass projectMomentum into OverviewView
old_prop = """              projectOnlineCount={projectOnlineCount}"""
new_prop = """              projectOnlineCount={projectOnlineCount}
              projectMomentum={projectMomentum}"""

if old_prop in text and "projectMomentum={projectMomentum}" not in text:
    text = text.replace(old_prop, new_prop, 1)
    changed += 1
    print("✅ Passed projectMomentum into OverviewView.")
elif "projectMomentum={projectMomentum}" in text:
    print("ℹ️ projectMomentum already passed into OverviewView.")
else:
    raise SystemExit("❌ Could not find OverviewView projectOnlineCount prop.")

path.write_text(text)

print("")
print(f"✅ Done. Replacements/insertions: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "buildProjectMomentum|projectMomentum|serverMomentum|MomentumCard|headerMetrics" src/pages/ProjectHome.jsx -C 8')
