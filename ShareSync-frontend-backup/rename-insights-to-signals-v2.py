from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/components/insights/InsightsTab.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-signals-rename-v2-{timestamp}")
shutil.copy2(path, backup)

updated = original

# 1) Add BarChart3 to the lucide-react import safely.
lucide_import_match = re.search(
    r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];",
    updated
)

if not lucide_import_match:
    raise RuntimeError(
        f"Could not find lucide-react import. No changes written. Backup kept at: {backup}"
    )

icons_raw = lucide_import_match.group(1)
icons = [icon.strip() for icon in icons_raw.split(",") if icon.strip()]

if "BarChart3" not in icons:
    icons.append("BarChart3")

new_import = "import { " + ", ".join(icons) + " } from 'lucide-react';"
updated = (
    updated[:lucide_import_match.start()]
    + new_import
    + updated[lucide_import_match.end():]
)

# 2) Rename visible section title.
updated = updated.replace("Project Insights", "Signals")

# 3) Update the main description if present.
updated = updated.replace(
    "Read velocity, cycle time, completion health, and team activity from one execution signal board.",
    "Track velocity, cycle time, completion health, and team activity from one live signal board."
)

updated = updated.replace(
    "Velocity, cycle time, and team health.",
    "Velocity, cycle time, completion health, and team activity."
)

# 4) Replace the closest large Activity icon before the Signals title.
title_index = updated.find("Signals")

if title_index == -1:
    raise RuntimeError(
        f"Could not find Signals title after rename. No changes written. Backup kept at: {backup}"
    )

window_start = max(0, title_index - 1600)
before_title = updated[window_start:title_index]

icon_matches = list(
    re.finditer(
        r"<(Activity|Gauge|LineChart|ChartNoAxesColumnIncreasing|BarChart3)\b([^>]*)/>",
        before_title
    )
)

if icon_matches:
    last = icon_matches[-1]
    icon_name = last.group(1)
    icon_attrs = last.group(2)

    # Preserve className/props, only change the component name.
    replacement_icon = f"<BarChart3{icon_attrs}/>"
    abs_start = window_start + last.start()
    abs_end = window_start + last.end()

    updated = updated[:abs_start] + replacement_icon + updated[abs_end:]
else:
    print("Warning: Could not find a nearby header icon to replace. Title rename still applied.")

# 5) Optional: rename an existing small pill if the exact text exists.
# This is not required, so no safety failure if it doesn't exist.
updated = updated.replace(">Signals</span>", ">Signal Board</span>")
updated = updated.replace(">Signals</div>", ">Signal Board</div>")

# Safety checks: only require what actually matters.
required = [
    "BarChart3",
    "Signals",
    "WeeklyMomentumReport",
    "MetricCard",
    "SprintHealth",
    "TeamBalance",
    "ActivityFeed",
]

for marker in required:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. Backup kept at: {backup}"
        )

if "Project Insights" in updated:
    path.write_text(original)
    raise RuntimeError(
        f"Old Project Insights text still appears. Original restored. Backup kept at: {backup}"
    )

if updated == original:
    raise RuntimeError(f"No changes made. Backup kept at: {backup}")

path.write_text(updated)

print("Signals rename v2 applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Renamed Project Insights to Signals")
print("- Added BarChart3 to lucide imports")
print("- Replaced the closest large header icon with BarChart3 when found")
print("- Updated the description copy when matching text was present")
print("")
print("Kept intact:")
print("- WeeklyMomentumReport")
print("- MetricCard")
print("- SprintHealth")
print("- TeamBalance")
print("- ActivityFeed")
print("- API calls")
