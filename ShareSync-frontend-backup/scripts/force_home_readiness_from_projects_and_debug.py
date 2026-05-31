from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-force-home-readiness-projects-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Add missing extractArray helper if it does not exist.
if "function extractArray(" not in text:
    anchor = "function getHomeProjectId(project) {"
    helper = """function extractArray(payload) {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.activities,
    payload.feed,
    payload.records,
    payload.docs,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

"""
    if anchor not in text:
        raise SystemExit("❌ Could not find insertion anchor for extractArray. No changes written.")
    text = text.replace(anchor, helper + anchor, 1)
    print("✅ Added missing extractArray().")
else:
    print("✅ extractArray() already exists.")

# 2) Replace only the loadMissionReadiness function body with a stronger version.
start_marker = "    const loadMissionReadiness = async () => {"
end_marker = "    };\n\n    loadMissionReadiness();"

start = text.find(start_marker)
end = text.find(end_marker, start)

if start == -1 or end == -1:
    raise SystemExit("❌ Could not find loadMissionReadiness block. No changes written.")

new_block = """    const loadMissionReadiness = async () => {
      const safeProjects = Array.isArray(projects) ? projects : [];

      if (!safeProjects.length) {
        return;
      }

      // Fetch readiness from the real project records, then store it under
      // every ID/name key a Home mission could possibly use.
      const workItems = [];
      const seenProjectIds = new Set();

      safeProjects.forEach((project) => {
        if (!project || isProjectCompletedForHomeMission(project)) return;

        const projectId =
          (typeof resolveProjectIdForReadiness === "function"
            ? resolveProjectIdForReadiness(project)
            : "") ||
          getHomeProjectId(project);

        if (!projectId || seenProjectIds.has(projectId)) return;

        seenProjectIds.add(projectId);

        workItems.push({
          projectId,
          sourceProject: project,
        });
      });

      if (!workItems.length) return;

      const visibleMissions = [
        ...toMissions(safeProjects),
        ...toPriorityMissions(priorityTasks, safeProjects),
      ];

      const entries = await Promise.all(
        workItems.map(async ({ projectId, sourceProject }) => {
          try {
            const readinessPayload = await getProjectClosureReadiness(projectId);
            const readiness = normalizeHomeMissionReadinessPayload(readinessPayload);

            const matchingMissions = visibleMissions.filter((mission) => {
              const missionKeys = new Set(getHomeMissionReadinessKeys(mission));
              return getHomeMissionReadinessKeys(sourceProject).some((key) =>
                missionKeys.has(key)
              );
            });

            const lookupKeys = [
              projectId,
              ...getHomeMissionReadinessKeys(sourceProject),
              ...matchingMissions.flatMap((mission) =>
                getHomeMissionReadinessKeys(mission)
              ),
            ].filter(Boolean);

            const uniqueKeys = [...new Set(lookupKeys)];

            if (import.meta?.env?.DEV) {
              console.info("[useHomeRealtime] mission readiness hydrated", {
                projectId,
                projectName: sourceProject?.name || sourceProject?.title,
                readinessScore: readiness?.readinessScore,
                lookupKeys: uniqueKeys,
              });
            }

            return {
              projectId,
              readiness,
              lookupKeys: uniqueKeys,
            };
          } catch (error) {
            console.warn("[useHomeRealtime] Mission readiness hydration failed:", {
              projectId,
              projectName: sourceProject?.name || sourceProject?.title,
              message: error?.message || error,
            });

            return null;
          }
        })
      );

      if (cancelled) return;

      setMissionReadinessByProjectId((previous) => {
        const next = { ...previous };

        entries.filter(Boolean).forEach(({ readiness, lookupKeys }) => {
          lookupKeys.forEach((key) => {
            next[key] = readiness;
          });
        });

        return next;
      });
    };
"""

text = text[:start] + new_block + text[end + len("    };"):]

print("✅ Replaced loadMissionReadiness() with project-record based hydration.")

# 3) Ensure final missions pass projects into applyReadinessToMission.
text = text.replace(
    "applyReadinessToMission(mission, missionReadinessByProjectId)",
    "applyReadinessToMission(mission, missionReadinessByProjectId, projects)"
)

# 4) Add window.__debugHomeMissions so we can inspect real state from DevTools.
debug_anchor = """  const computedSummary = useMemo(() => {"""

debug_block = """  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.__debugHomeMissions = () => {
      const rows = missions.map((mission) => ({
        id: mission?.id,
        _id: mission?._id,
        projectId:
          mission?.projectId?._id ||
          mission?.projectId?.id ||
          mission?.projectId,
        title: mission?.title || mission?.name,
        progress: mission?.progress,
        readinessScore: mission?.readinessScore,
        closureReadinessScore: mission?.closureReadiness?.readinessScore,
        status: mission?.status,
      }));

      console.table(rows);
      console.log("missionReadinessByProjectId:", missionReadinessByProjectId);
      console.log("projects:", projects);
      console.log("priorityTasks:", priorityTasks);

      return {
        missions,
        missionReadinessByProjectId,
        projects,
        priorityTasks,
      };
    };

    return () => {
      if (window.__debugHomeMissions) {
        delete window.__debugHomeMissions;
      }
    };
  }, [missions, missionReadinessByProjectId, projects, priorityTasks]);

"""

if "window.__debugHomeMissions" not in text:
    if debug_anchor not in text:
        raise SystemExit("❌ Could not find debug insertion point. No changes written.")
    text = text.replace(debug_anchor, debug_block + debug_anchor, 1)
    print("✅ Added window.__debugHomeMissions().")
else:
    print("✅ window.__debugHomeMissions() already exists.")

# Safety checks.
if text.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety failed: applyReadinessToMission count is not exactly 1.")

if "applyReadinessToMission(mission, missionReadinessByProjectId)" in text:
    raise SystemExit("❌ Safety failed: old applyReadinessToMission call still exists.")

if "function extractArray(" not in text:
    raise SystemExit("❌ Safety failed: extractArray still missing.")

path.write_text(text)

print("")
print("✅ Home readiness hydration now fetches readiness from real project records.")
print("✅ Home missions now get readiness using project IDs and project names.")
print("✅ Missing extractArray helper fixed.")
print("✅ Debug function added: window.__debugHomeMissions()")
print("")
print("Inspect with:")
print('rg -n "function extractArray|loadMissionReadiness|mission readiness hydrated|__debugHomeMissions|applyReadinessToMission\\(mission" src/hooks/useHomeRealtime.js -C 6')
print("node --check src/hooks/useHomeRealtime.js")
