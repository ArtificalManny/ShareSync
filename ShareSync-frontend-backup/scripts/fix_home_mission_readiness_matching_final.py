from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-final-readiness-key-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Replace getHomeProjectLookupKeys with a stronger ID + name matcher
# ─────────────────────────────────────────────────────────────────────────────

lookup_start = text.find("function getHomeProjectLookupKeys(project) {")
if lookup_start == -1:
    raise SystemExit("❌ Could not find getHomeProjectLookupKeys(). No changes written.")

lookup_end = text.find("\nfunction ", lookup_start + 1)
if lookup_end == -1:
    raise SystemExit("❌ Could not find the next function after getHomeProjectLookupKeys(). No changes written.")

new_lookup = '''function getHomeProjectLookupKeys(project) {
  const normalizeId = (value) => {
    if (!value) return "";

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (typeof value === "object") {
      const nested =
        value?._id ||
        value?.id ||
        value?.projectId ||
        value?.sourceProjectId ||
        value?.$oid ||
        value?.value;

      if (nested) return normalizeId(nested);

      const stringified = value?.toString?.();
      if (stringified && stringified !== "[object Object]") {
        return String(stringified).trim();
      }
    }

    return "";
  };

  const normalizeName = (value) => {
    if (typeof value !== "string" && typeof value !== "number") return "";
    return String(value).trim().toLowerCase();
  };

  const idCandidates = [
    project?._id,
    project?.id,
    project?.projectId,
    project?.sourceProjectId,
    project?.parentProjectId,
    project?.project?._id,
    project?.project?.id,
    project?.project?.projectId,
    project?.recommendedTask?.projectId,
    project?.task?.projectId,
    project?.baseProject?._id,
    project?.baseProject?.id,
    project?.baseProject?.projectId,
  ]
    .map(normalizeId)
    .filter(Boolean);

  const nameCandidates = [
    project?.name,
    project?.title,
    project?.projectName,
    project?.baseMission,
    project?.project?.name,
    project?.project?.title,
    project?.recommendedTask?.projectName,
    project?.task?.projectName,
    project?.baseProject?.name,
    project?.baseProject?.title,
  ]
    .map(normalizeName)
    .filter(Boolean)
    .map((name) => `name:${name}`);

  return [...new Set([...idCandidates, ...nameCandidates])];
}

'''

text = text[:lookup_start] + new_lookup + text[lookup_end:]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Replace the mission readiness hydration effect
# ─────────────────────────────────────────────────────────────────────────────

load_marker = "const loadMissionReadiness = async () => {"
load_pos = text.find(load_marker)

if load_pos == -1:
    raise SystemExit("❌ Could not find loadMissionReadiness effect. No changes written.")

effect_start = text.rfind("  useEffect(() => {", 0, load_pos)

if effect_start == -1:
    raise SystemExit("❌ Could not find useEffect start before loadMissionReadiness. No changes written.")

dep_markers = [
    "\n  }, [projects, priorityTasks]);",
    "\n  }, [priorityTasks, projects]);",
    "\n  }, [projects]);",
]

effect_end = -1
used_marker = ""

for marker in dep_markers:
    candidate = text.find(marker, load_pos)
    if candidate != -1:
        effect_end = candidate + len(marker)
        used_marker = marker
        break

if effect_end == -1:
    raise SystemExit("❌ Could not find useEffect dependency ending. No changes written.")

new_effect = '''  useEffect(() => {
    let cancelled = false;

    const resolveProjectIdForReadiness = (item) => {
      const normalizeId = (value) => {
        if (!value) return "";

        if (typeof value === "string" || typeof value === "number") {
          return String(value).trim();
        }

        if (typeof value === "object") {
          const nested =
            value?._id ||
            value?.id ||
            value?.projectId ||
            value?.sourceProjectId ||
            value?.$oid ||
            value?.value;

          if (nested) return normalizeId(nested);

          const stringified = value?.toString?.();
          if (stringified && stringified !== "[object Object]") {
            return String(stringified).trim();
          }
        }

        return "";
      };

      const candidates = [
        item?._id,
        item?.id,
        item?.projectId,
        item?.sourceProjectId,
        item?.parentProjectId,
        item?.project?._id,
        item?.project?.id,
        item?.project?.projectId,
        item?.baseProject?._id,
        item?.baseProject?.id,
        item?.baseProject?.projectId,
      ]
        .map(normalizeId)
        .filter(Boolean);

      return candidates.find((value) => /^[a-f0-9]{24}$/i.test(value)) || candidates[0] || "";
    };

    const findMatchingProjectForMission = (mission, safeProjects) => {
      const missionKeys = new Set(getHomeProjectLookupKeys(mission));

      return (
        safeProjects.find((project) =>
          getHomeProjectLookupKeys(project).some((key) => missionKeys.has(key))
        ) || null
      );
    };

    const loadMissionReadiness = async () => {
      const safeProjects = Array.isArray(projects) ? projects : [];
      const priorityMissions = toPriorityMissions(priorityTasks, safeProjects);
      const visibleMissions =
        priorityMissions.length > 0 ? priorityMissions : toMissions(safeProjects);

      if (!visibleMissions.length) {
        return;
      }

      const workItems = [];
      const seenProjectIds = new Set();

      visibleMissions.forEach((mission) => {
        const matchedProject = findMatchingProjectForMission(mission, safeProjects);
        const sourceProject = matchedProject || mission;
        const projectId = resolveProjectIdForReadiness(sourceProject);

        if (!projectId || seenProjectIds.has(projectId)) return;
        if (isProjectCompletedForHomeMission(sourceProject)) return;

        seenProjectIds.add(projectId);

        workItems.push({
          projectId,
          mission,
          sourceProject,
        });
      });

      if (!workItems.length) return;

      const entries = await Promise.all(
        workItems.map(async ({ projectId, mission, sourceProject }) => {
          try {
            const readinessPayload = await getProjectClosureReadiness(projectId);
            const readiness = normalizeHomeMissionReadinessPayload(readinessPayload);

            const lookupKeys = [
              projectId,
              ...getHomeProjectLookupKeys(sourceProject),
              ...getHomeProjectLookupKeys(mission),
            ].filter(Boolean);

            if (import.meta?.env?.DEV) {
              console.debug("[useHomeRealtime] mission readiness hydrated", {
                projectId,
                missionName: mission?.title || mission?.name,
                projectName: sourceProject?.title || sourceProject?.name,
                readinessScore: readiness?.readinessScore,
                lookupKeys,
              });
            }

            return {
              readiness,
              lookupKeys: [...new Set(lookupKeys)],
            };
          } catch (error) {
            console.warn("[useHomeRealtime] Mission readiness hydration failed:", {
              projectId,
              missionName: mission?.title || mission?.name,
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

    loadMissionReadiness();

    return () => {
      cancelled = true;
    };
  }, [projects, priorityTasks]);'''

text = text[:effect_start] + new_effect + text[effect_end:]


# ─────────────────────────────────────────────────────────────────────────────
# Safety checks
# ─────────────────────────────────────────────────────────────────────────────

if text.count("function getHomeProjectLookupKeys(") != 1:
    raise SystemExit("❌ Safety failed: getHomeProjectLookupKeys count is not 1.")

if text.count("const loadMissionReadiness = async () => {") != 1:
    raise SystemExit("❌ Safety failed: loadMissionReadiness count is not 1.")

if text.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety failed: applyReadinessToMission count is not 1.")

path.write_text(text)

print("✅ Home mission readiness matching fixed.")
print("✅ Readiness now matches by project id AND project name.")
print("✅ Priority-task missions should now receive the same readiness score as ProjectHome.")
print("")
print("Inspect with:")
print('rg -n "getHomeProjectLookupKeys|findMatchingProjectForMission|mission readiness hydrated|applyReadinessToMission|const missions = useMemo" src/hooks/useHomeRealtime.js -C 6')
print("node --check src/hooks/useHomeRealtime.js")
