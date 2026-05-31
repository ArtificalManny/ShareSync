from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")

if not path.exists():
    raise SystemExit(f"❌ Missing file: {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-wire-home-mission-readiness-state-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Ensure the API import exists.
if 'getProjectClosureReadiness' not in text:
    import_line = 'import { getProjectClosureReadiness } from "../api/projects";\n'
    lines = text.splitlines(True)
    insert_at = 0

    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1

    lines.insert(insert_at, import_line)
    text = "".join(lines)
    print("✅ Added getProjectClosureReadiness import.")
else:
    print("✅ getProjectClosureReadiness import already exists.")

# 2) Ensure helper exists.
helper = '''
function applyReadinessToMission(mission, readinessByProjectId = {}) {
  const projectId = getHomeProjectId(mission);
  const readiness = projectId ? readinessByProjectId[projectId] : null;

  if (!readiness) return mission;

  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round(Number(readiness.readinessScore ?? 0)))
  );

  return {
    ...mission,
    progress: readinessScore,
    readinessScore,
    isReadyToClose: Boolean(readiness.isReadyToClose),
    blockingReasons: Array.isArray(readiness.blockingReasons) ? readiness.blockingReasons : [],
    warnings: Array.isArray(readiness.warnings) ? readiness.warnings : [],
    closureReadiness: readiness.closureReadiness || readiness,
  };
}
'''

if "function applyReadinessToMission(" not in text:
    marker = "function toPriorityMissions"
    idx = text.find(marker)

    if idx == -1:
        marker = "export default function useHomeRealtime"
        idx = text.find(marker)

    if idx == -1:
        marker = "export function useHomeRealtime"
        idx = text.find(marker)

    if idx == -1:
        raise SystemExit("❌ Could not find a safe helper insertion point. No changes written.")

    text = text[:idx] + helper + "\n" + text[idx:]
    print("✅ Added applyReadinessToMission helper.")
else:
    print("✅ applyReadinessToMission helper already exists.")

# 3) Add state beside priorityTasks state.
if "missionReadinessByProjectId" not in text:
    old = "const [priorityTasks, setPriorityTasks] = useState([]);"
    new = old + "\n  const [missionReadinessByProjectId, setMissionReadinessByProjectId] = useState({});"

    if old not in text:
        raise SystemExit("❌ Could not find priorityTasks state line. No changes written.")

    text = text.replace(old, new, 1)
    print("✅ Added missionReadinessByProjectId state.")
else:
    print("✅ missionReadinessByProjectId already exists.")

# 4) Add hydration effect before the missions useMemo.
effect = '''
  useEffect(() => {
    let cancelled = false;

    const loadMissionReadiness = async () => {
      const priorityMissions = toPriorityMissions(priorityTasks, projects);
      const visibleMissions = (
        priorityMissions.length > 0 ? priorityMissions : toMissions(projects)
      ).slice(0, 3);

      const projectIds = [
        ...new Set(
          visibleMissions
            .map((mission) => getHomeProjectId(mission))
            .filter(Boolean)
        ),
      ];

      if (projectIds.length === 0) {
        if (!cancelled) setMissionReadinessByProjectId({});
        return;
      }

      const entries = await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const readinessPayload = await getProjectClosureReadiness(projectId);
            const readiness = normalizeHomeMissionReadinessPayload(readinessPayload);

            return [projectId, readiness];
          } catch (error) {
            console.warn("[useHomeRealtime] Mission readiness hydration failed:", {
              projectId,
              message: error?.message || error,
            });

            return null;
          }
        })
      );

      if (cancelled) return;

      setMissionReadinessByProjectId((previous) => {
        const next = { ...previous };

        entries.filter(Boolean).forEach(([projectId, readiness]) => {
          next[projectId] = readiness;
        });

        return next;
      });
    };

    loadMissionReadiness();

    return () => {
      cancelled = true;
    };
  }, [projects, priorityTasks]);
'''

if "const loadMissionReadiness = async () =>" not in text:
    marker = "  const missions = useMemo(() => {"
    idx = text.find(marker)

    if idx == -1:
        raise SystemExit("❌ Could not find `const missions = useMemo`. No changes written.")

    text = text[:idx] + effect + "\n" + text[idx:]
    print("✅ Added mission readiness hydration effect.")
else:
    print("✅ mission readiness hydration effect already exists.")

# 5) Replace missions useMemo so it merges readiness into the visible cards.
old_block = '''  const missions = useMemo(() => {
    const priorityMissions = toPriorityMissions(priorityTasks, projects);
    return priorityMissions.length > 0 ? priorityMissions : toMissions(projects);
  }, [priorityTasks, projects]);'''

new_block = '''  const missions = useMemo(() => {
    const priorityMissions = toPriorityMissions(priorityTasks, projects);
    const baseMissions = priorityMissions.length > 0 ? priorityMissions : toMissions(projects);

    return baseMissions.map((mission) =>
      applyReadinessToMission(mission, missionReadinessByProjectId)
    );
  }, [priorityTasks, projects, missionReadinessByProjectId]);'''

if old_block in text:
    text = text.replace(old_block, new_block, 1)
    print("✅ Replaced missions useMemo with readiness-aware version.")
elif "applyReadinessToMission(mission, missionReadinessByProjectId)" in text:
    print("✅ missions useMemo already readiness-aware.")
else:
    raise SystemExit("❌ Could not replace missions useMemo. No changes written.")

path.write_text(text)

print("")
print("✅ Home missions now hydrate Finish Line readiness asynchronously.")
print("✅ Progress bars should update from 0% to the same readiness score used by ProjectHome.")
print("")
print("Inspect with:")
print('rg -n "missionReadinessByProjectId|loadMissionReadiness|applyReadinessToMission|const missions = useMemo|getProjectClosureReadiness" src/hooks/useHomeRealtime.js -C 6')
