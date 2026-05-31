from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/insights/InsightsTab.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-signals-rename-{timestamp}")
shutil.copy2(path, backup)

updated = original

# 1) Add BarChart3 to lucide imports if missing.
old_import = "import { Gauge, Clock3, Target, Users2, Activity, Scale } from 'lucide-react';"
new_import = "import { Gauge, Clock3, Target, Users2, Activity, Scale, BarChart3 } from 'lucide-react';"

if old_import in updated:
    updated = updated.replace(old_import, new_import)
elif "BarChart3" not in updated:
    raise RuntimeError(
        f"Could not find lucide import block safely. No changes written. Backup kept at: {backup}"
    )

# 2) Replace only the big header title.
updated = updated.replace(
    """<h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Project Insights
              </h2>""",
    """<h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Signals
              </h2>"""
)

# 3) Replace the large header icon with the navbar-style Signals icon.
updated = updated.replace(
    '<Activity className="h-6 w-6" />',
    '<BarChart3 className="h-6 w-6" />'
)

# 4) Make the support pill less redundant now that the title is Signals.
updated = updated.replace(
    """> 
                Signals
              </span>""",
    """>
                Signal Board
              </span>"""
)

# 5) Make the description match the new section name.
updated = updated.replace(
    "Read velocity, cycle time, completion health, and team activity from one execution signal board.",
    "Track velocity, cycle time, completion health, and team activity from one live signal board."
)

# Safety checks
required = [
    "BarChart3",
    "Signals",
    "Signal Board",
    "Live Metrics",
    "WeeklyMomentumReport",
    "ActivityFeed",
    "MetricCard",
    "SprintHealth",
    "TeamBalance",
]

for marker in required:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. Backup kept at: {backup}"
        )

if "Project Insights</h2>" in updated:
    path.write_text(original)
    raise RuntimeError(
        f"Old Project Insights header still appears. Original restored. Backup kept at: {backup}"
    )

if updated == original:
    raise RuntimeError(f"No changes made. Backup kept at: {backup}")

path.write_text(updated)

print("Signals header rename applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Renamed the main Insights header to Signals")
print("- Replaced the large header icon with BarChart3")
print("- Renamed the small Signals pill to Signal Board")
print("- Updated the description copy")
print("")
print("Kept intact:")
print("- WeeklyMomentumReport")
print("- MetricCard")
print("- SprintHealth")
print("- TeamBalance")
print("- ActivityFeed")
print("- API calls")
