from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(f".jsx.bak-before-team-capacity-live-wire-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)

changed = 0

import_line = 'import buildProjectTeamCapacity from "../utils/projectTeamCapacity";\n'

if import_line not in text:
    markers = [
        'import buildProjectActiveGoals from "../utils/projectActiveGoals";\n',
        'import buildProjectForesight from "../utils/projectForesight";\n',
        'import { buildProjectPulse } from "../utils/projectPulse";\n',
        'import { getStatusColor } from "../utils/statusColor";\n',
    ]

    inserted = False

    for marker in markers:
        if marker in text:
            text = text.replace(marker, marker + import_line, 1)
            inserted = True
            changed += 1
            print("✅ Added buildProjectTeamCapacity import.")
            break

    if not inserted:
        raise SystemExit("❌ Could not find a safe import marker for buildProjectTeamCapacity.")
else:
    print("ℹ️ buildProjectTeamCapacity import already exists.")

if "projectTasksForTeamCapacity" not in text:
    old = '  const teamCapacity = Array.isArray(overview?.teamCapacity) ? overview.teamCapacity : [];\n'

    new = '''  const rawTeamCapacity =
    Array.isArray(overview?.teamCapacity) || typeof overview?.teamCapacity === "object"
      ? overview?.teamCapacity
      : metrics?.teamCapacity || null;

  const projectTasksForTeamCapacity =
    typeof liveTasks !== "undefined" && Array.isArray(liveTasks)
      ? liveTasks
      : typeof tasks !== "undefined" && Array.isArray(tasks)
        ? tasks
        : [];

  const teamCapacity = useMemo(() => {
    return buildProjectTeamCapacity({
      project,
      tasks: projectTasksForTeamCapacity,
      overview,
      fallback: rawTeamCapacity,
    });
  }, [project, projectTasksForTeamCapacity, overview, rawTeamCapacity]);
'''

    if old in text:
        text = text.replace(old, new, 1)
        changed += 1
        print("✅ Replaced raw overview teamCapacity with live computed teamCapacity.")
    else:
        pattern = r"\n\s*const teamCapacity = Array\.isArray\(overview\?\.teamCapacity\)\s*\?\s*overview\.teamCapacity\s*:\s*\[\];\n"
        text, count = re.subn("\n" + pattern.strip() + "\n", "\n" + new + "\n", text, count=1)
        changed += count

        if count:
            print("✅ Replaced raw overview teamCapacity with live computed teamCapacity.")
        else:
            raise SystemExit(
                "❌ Could not find the teamCapacity line. Run:\n"
                "rg -n \"const teamCapacity|teamMetrics|TeamCapacityCard\" src/pages/ProjectHome.jsx -C 10"
            )
else:
    print("ℹ️ ProjectHome already has projectTasksForTeamCapacity wiring.")

path.write_text(text)

print("")
print(f"✅ Team Capacity ProjectHome wiring complete. Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "buildProjectTeamCapacity|projectTasksForTeamCapacity|rawTeamCapacity|const teamCapacity|TeamCapacityCard" src/pages/ProjectHome.jsx -C 8')
