from pathlib import Path
from datetime import datetime

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-direct-readiness-hydration-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

text = text.replace(
    'import React from "react";',
    'import React, { useEffect, useMemo, useState } from "react";',
    1,
)

if 'getProjectClosureReadiness' not in text:
    text = text.replace(
        'import { tryShipProject } from "../../api/home";',
        'import { tryShipProject } from "../../api/home";\nimport { getProjectClosureReadiness } from "../../api/projects";',
        1,
    )

helper_anchor = "function getMissionProjectForAvatar(mission) {"

helpers = r'''
function getMissionProjectId(mission) {
  const raw =
    mission?.projectId?._id ||
    mission?.projectId?.id ||
    mission?.projectId ||
    mission?.project?._id ||
    mission?.project?.id ||
    mission?._id ||
    mission?.id;

  if (!raw) return "";

  if (typeof raw === "object") {
    return String(raw._id || raw.id || raw.toString?.() || "");
  }

  return String(raw);
}

function normalizeMissionReadiness(readiness) {
  const data =
    readiness?.data ||
    readiness?.closureReadiness ||
    readiness?.finishLine ||
    readiness?.readiness ||
    readiness ||
    {};

  const score = clampPercent(
    data?.readinessScore ??
      data?.score ??
      data?.progress ??
      data?.completionPercent ??
      0
  );

  return {
    readinessScore: score,
    progress: score,
    isReadyToClose: Boolean(data?.isReadyToClose),
    blockingReasons: Array.isArray(data?.blockingReasons) ? data.blockingReasons : [],
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
    closureReadiness: {
      ...data,
      readinessScore: score,
    },
  };
}

'''

if "function getMissionProjectId(" not in text:
    if helper_anchor not in text:
        raise SystemExit("❌ Could not find helper insertion point.")
    text = text.replace(helper_anchor, helpers + helper_anchor, 1)

old_block = '''  const projectId = project?.id || project?._id || project?.projectId;
  const isThisShipping = isItemShipping(projectId);
  const isThisShipped = isItemShipped(projectId);
  const currentPhase = isThisShipping || isThisShipped ? phase : PHASES.IDLE;

  const title = getDisplayTitle(project);
  const subtitle = getDisplaySubtitle(project);
  const reason = getDisplayReason(project);
  const progressValue = getProgressValue(project);
  const priorityLabel = getPriorityLabel(project);
  const isPriorityMission = isRecommendedTaskMission(project);
'''

new_block = '''  const projectId = getMissionProjectId(project);
  const isThisShipping = isItemShipping(projectId);
  const isThisShipped = isItemShipped(projectId);
  const currentPhase = isThisShipping || isThisShipped ? phase : PHASES.IDLE;

  const [readinessOverride, setReadinessOverride] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!projectId) {
      setReadinessOverride(null);
      return undefined;
    }

    async function loadReadiness() {
      try {
        const readiness = await getProjectClosureReadiness(projectId);
        if (cancelled) return;

        const normalized = normalizeMissionReadiness(readiness);
        setReadinessOverride(normalized);
      } catch (error) {
        if (!cancelled) {
          console.warn("[MissionCard] Failed to hydrate project readiness:", {
            projectId,
            projectTitle: project?.title || project?.name,
            message: error?.message || error,
          });
        }
      }
    }

    loadReadiness();

    return () => {
      cancelled = true;
    };
  }, [projectId, project?.title, project?.name]);

  const hydratedProject = useMemo(() => {
    if (!readinessOverride) return project;

    return {
      ...project,
      ...readinessOverride,
      progress: readinessOverride.readinessScore,
      readinessScore: readinessOverride.readinessScore,
      closureReadiness: readinessOverride.closureReadiness,
    };
  }, [project, readinessOverride]);

  const title = getDisplayTitle(hydratedProject);
  const subtitle = getDisplaySubtitle(hydratedProject);
  const reason = getDisplayReason(hydratedProject);
  const progressValue = getProgressValue(hydratedProject);
  const priorityLabel = getPriorityLabel(hydratedProject);
  const isPriorityMission = isRecommendedTaskMission(hydratedProject);
'''

if old_block not in text:
    raise SystemExit("❌ Could not find MissionCard project/progress block. No changes written.")

text = text.replace(old_block, new_block, 1)

# Make sure remaining references that should use hydrated data do so.
text = text.replace(
    '<ProjectAvatar\n                project={getMissionProjectForAvatar(project)}',
    '<ProjectAvatar\n                project={getMissionProjectForAvatar(hydratedProject)}',
    1,
)

text = text.replace(
    'isInFocus={project?.assigneeInFocus || project?.isInFocus || false}',
    'isInFocus={hydratedProject?.assigneeInFocus || hydratedProject?.isInFocus || false}',
    1,
)

if text.count("function getMissionProjectId(") != 1:
    raise SystemExit("❌ Safety failed: getMissionProjectId count is not exactly 1.")

if "getProjectClosureReadiness" not in text:
    raise SystemExit("❌ Safety failed: getProjectClosureReadiness import missing.")

path.write_text(text)

print("✅ MissionCard now hydrates readiness directly from ProjectHome's readiness API helper.")
print("✅ ShareSync Core should update from 0% to 85% after refresh.")
print("")
print("Inspect with:")
print('rg -n "useEffect|useMemo|useState|getProjectClosureReadiness|getMissionProjectId|normalizeMissionReadiness|progressValue" src/components/home/MissionCard.jsx -C 5')
