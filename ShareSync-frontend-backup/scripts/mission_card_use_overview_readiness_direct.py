from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-overview-readiness-direct-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Ensure React hooks are imported.
text = text.replace(
    'import React from "react";',
    'import React, { useEffect, useMemo, useState } from "react";',
    1,
)

# If the old import exists, remove it. We are bypassing the helper and using the proven overview endpoint directly.
text = text.replace(
    'import { getProjectClosureReadiness } from "../../api/projects";\n',
    '',
)

# 2) Add direct overview-readiness helpers before getMissionProjectForAvatar.
anchor = "function getMissionProjectForAvatar(mission) {"

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

function getAuthTokenForMissionCard() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function pickMissionOverviewReadiness(payload) {
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

  const score = clampPercent(
    match.readinessScore ??
      match.score ??
      match.progress ??
      match.completionPercent ??
      0
  );

  return {
    ...match,
    readinessScore: score,
    progress: score,
    closureReadiness: {
      ...match,
      readinessScore: score,
    },
  };
}

async function fetchMissionOverviewReadiness(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return null;

  const token = getAuthTokenForMissionCard();

  const response = await fetch(`/api/projects/${id}/overview`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    console.warn("[MissionCard] Overview readiness request failed:", {
      projectId: id,
      status: response.status,
      body,
    });
    return null;
  }

  return pickMissionOverviewReadiness(body);
}

'''

if "function fetchMissionOverviewReadiness(" not in text:
    if anchor not in text:
        raise SystemExit("❌ Could not find getMissionProjectForAvatar insertion point.")
    text = text.replace(anchor, helpers + anchor, 1)

# 3) Replace the MissionCard useEffect block that tries to hydrate readiness.
pattern = re.compile(
    r'''  useEffect\(\(\) => \{\n    let cancelled = false;[\s\S]*?\n  \}, \[projectId, project\?\.(?:title|name), project\?\.(?:title|name)\]\);''',
    re.MULTILINE,
)

replacement = '''  useEffect(() => {
    let cancelled = false;

    if (!projectId) {
      setReadinessOverride(null);
      return undefined;
    }

    async function loadReadiness() {
      const readiness = await fetchMissionOverviewReadiness(projectId);

      if (cancelled) return;

      if (!readiness) {
        setReadinessOverride(null);
        return;
      }

      setReadinessOverride(readiness);

      window.__missionCardReadinessDebug = window.__missionCardReadinessDebug || {};
      window.__missionCardReadinessDebug[projectId] = {
        projectId,
        title: project?.title || project?.name,
        readinessScore: readiness.readinessScore,
        readiness,
      };

      console.debug("[MissionCard] readiness hydrated from overview:", {
        projectId,
        title: project?.title || project?.name,
        readinessScore: readiness.readinessScore,
      });
    }

    loadReadiness();

    return () => {
      cancelled = true;
    };
  }, [projectId, project?.title, project?.name]);'''

text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    raise SystemExit("❌ Could not replace MissionCard readiness useEffect. No changes written.")

# 4) Make sure hydratedProject cannot accidentally preserve stale 0 progress.
old = '''  const hydratedProject = useMemo(() => {
    if (!readinessOverride) return project;

    return {
      ...project,
      ...readinessOverride,
      progress: readinessOverride.readinessScore,
      readinessScore: readinessOverride.readinessScore,
      closureReadiness: readinessOverride.closureReadiness,
    };
  }, [project, readinessOverride]);'''

new = '''  const hydratedProject = useMemo(() => {
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
  }, [project, readinessOverride]);'''

if old in text:
    text = text.replace(old, new, 1)
else:
    print("⚠️ hydratedProject block was not in the expected exact shape. Leaving it unchanged.")

if text.count("function getMissionProjectId(") != 1:
    raise SystemExit("❌ Safety failed: getMissionProjectId should exist exactly once.")

if text.count("function fetchMissionOverviewReadiness(") != 1:
    raise SystemExit("❌ Safety failed: fetchMissionOverviewReadiness should exist exactly once.")

path.write_text(text)

print("")
print("✅ MissionCard now fetches readiness directly from /api/projects/:id/overview.")
print("✅ This bypasses useHomeRealtime matching and the getProjectClosureReadiness helper.")
print("✅ Open DevTools and run: window.__missionCardReadinessDebug")
print("")
print("Inspect with:")
print('rg -n "fetchMissionOverviewReadiness|pickMissionOverviewReadiness|__missionCardReadinessDebug|hydratedProject|progressValue" src/components/home/MissionCard.jsx -C 6')
print("node --check src/components/home/MissionCard.jsx")
