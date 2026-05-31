from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-direct-overview-readiness-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) React needs hooks now.
text, import_count = re.subn(
    r'import React(?:,\s*\{[^}]*\})?\s+from\s+["\']react["\'];',
    'import React, { useEffect, useMemo, useState } from "react";',
    text,
    count=1,
)

if import_count != 1:
    raise SystemExit("❌ Could not update React import. No changes written.")

# 2) Add unique helpers. Unique names avoid colliding with older failed patches.
helpers = r'''
function resolveMissionCardProjectId(mission) {
  const raw =
    mission?.projectId?._id ||
    mission?.projectId?.id ||
    mission?.projectId ||
    mission?.project?._id ||
    mission?.project?.id ||
    mission?.recommendedTask?.projectId?._id ||
    mission?.recommendedTask?.projectId?.id ||
    mission?.recommendedTask?.projectId ||
    mission?._id ||
    mission?.id;

  if (!raw) return "";

  if (typeof raw === "object") {
    return String(raw._id || raw.id || raw.toString?.() || "");
  }

  return String(raw);
}

function getMissionCardAuthToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function pickMissionCardOverviewReadiness(payload) {
  const data =
    payload?.data ||
    payload?.overview ||
    payload?.result ||
    payload ||
    {};

  const candidates = [
    data?.closureReadiness,
    data?.finishLine,
    data?.readiness,
    data?.project?.closureReadiness,
    data?.project?.finishLine,
    data?.project?.readiness,
  ].filter(Boolean);

  const match = candidates.find((item) => {
    const raw =
      item?.readinessScore ??
      item?.score ??
      item?.progress ??
      item?.completionPercent;

    return Number.isFinite(Number(raw));
  });

  if (!match) return null;

  const readinessScore = clampPercent(
    match.readinessScore ??
      match.score ??
      match.progress ??
      match.completionPercent ??
      0
  );

  return {
    ...match,
    readinessScore,
    progress: readinessScore,
    closureReadiness: {
      ...match,
      readinessScore,
    },
  };
}

async function fetchMissionCardOverviewReadiness(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return null;

  const token = getMissionCardAuthToken();

  const response = await fetch(`/api/projects/${id}/overview`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    console.warn("[MissionCard] overview readiness failed:", {
      projectId: id,
      status: response.status,
      body,
    });
    return null;
  }

  return pickMissionCardOverviewReadiness(body);
}

'''

if "function resolveMissionCardProjectId(" not in text:
    anchor = "\nfunction getMissionProjectForAvatar(mission) {"
    if anchor not in text:
        raise SystemExit("❌ Could not find getMissionProjectForAvatar insertion point. No changes written.")

    text = text.replace(anchor, "\n" + helpers + anchor, 1)

# 3) Replace the projectId line with local readiness hydration.
old_project_id_block = '''  const projectId = project?.id || project?._id || project?.projectId;
  const isThisShipping = isItemShipping(projectId);'''

new_project_id_block = '''  const projectId = resolveMissionCardProjectId(project);
  const [readinessOverride, setReadinessOverride] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!projectId) {
      setReadinessOverride(null);
      return undefined;
    }

    async function loadOverviewReadiness() {
      const readiness = await fetchMissionCardOverviewReadiness(projectId);

      if (cancelled) return;

      setReadinessOverride(readiness);

      window.__missionCardDirectReadiness = window.__missionCardDirectReadiness || {};
      window.__missionCardDirectReadiness[projectId] = {
        projectId,
        title: project?.title || project?.name || project?.projectName,
        readinessScore: readiness?.readinessScore ?? null,
        readiness,
      };

      console.debug("[MissionCard] direct overview readiness:", {
        projectId,
        title: project?.title || project?.name || project?.projectName,
        readinessScore: readiness?.readinessScore ?? null,
      });
    }

    loadOverviewReadiness();

    return () => {
      cancelled = true;
    };
  }, [projectId, project?.title, project?.name, project?.projectName]);

  const renderProject = useMemo(() => {
    if (!readinessOverride) return project;

    const readinessScore = clampPercent(readinessOverride.readinessScore);

    return {
      ...project,
      progress: readinessScore,
      readinessScore,
      closureReadiness: {
        ...(readinessOverride.closureReadiness || readinessOverride),
        readinessScore,
      },
      finishLine: {
        ...(project?.finishLine || {}),
        readinessScore,
      },
      readiness: {
        ...(project?.readiness || {}),
        readinessScore,
      },
    };
  }, [project, readinessOverride]);

  const isThisShipping = isItemShipping(projectId);'''

if old_project_id_block not in text:
    raise SystemExit("❌ Could not find the current projectId block. No changes written.")

text = text.replace(old_project_id_block, new_project_id_block, 1)

# 4) Make display/progress read from renderProject.
old_display_block = '''  const title = getDisplayTitle(project);
  const subtitle = getDisplaySubtitle(project);
  const reason = getDisplayReason(project);
  const progressValue = getProgressValue(project);
  const priorityLabel = getPriorityLabel(project);
  const isPriorityMission = isRecommendedTaskMission(project);'''

new_display_block = '''  const title = getDisplayTitle(renderProject);
  const subtitle = getDisplaySubtitle(renderProject);
  const reason = getDisplayReason(renderProject);
  const progressValue = getProgressValue(renderProject);
  const priorityLabel = getPriorityLabel(renderProject);
  const isPriorityMission = isRecommendedTaskMission(renderProject);'''

if old_display_block not in text:
    raise SystemExit("❌ Could not find display/progress block. No changes written.")

text = text.replace(old_display_block, new_display_block, 1)

path.write_text(text)

print("")
print("✅ MissionCard now hydrates readiness directly from /api/projects/:id/overview.")
print("✅ progressValue now reads from renderProject, not the stale project prop.")
print("✅ Do NOT run node --check on .jsx. Use npm run build.")
print("")
print("Inspect with:")
print('rg -n "resolveMissionCardProjectId|fetchMissionCardOverviewReadiness|renderProject|progressValue|__missionCardDirectReadiness" src/components/home/MissionCard.jsx -C 6')
