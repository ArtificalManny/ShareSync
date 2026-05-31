from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-force-direct-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Ensure React hooks import exists.
react_import = re.search(
    r'import\s+React(?:\s*,\s*\{(?P<hooks>[^}]*)\})?\s+from\s+[\'"]react[\'"];',
    text,
)

if not react_import:
    raise SystemExit("❌ Could not find React import. No changes written.")

existing_hooks = []
if react_import.group("hooks"):
    existing_hooks = [
        h.strip()
        for h in react_import.group("hooks").split(",")
        if h.strip()
    ]

for hook in ["useEffect", "useMemo", "useState"]:
    if hook not in existing_hooks:
        existing_hooks.append(hook)

new_react_import = f'import React, {{ {", ".join(existing_hooks)} }} from "react";'
text = text[:react_import.start()] + new_react_import + text[react_import.end():]

# 2) Add direct readiness helpers once.
helpers = r'''
function getMissionCardProjectId(project) {
  const raw =
    project?.sourceProjectId ||
    project?.parentProjectId ||
    project?.project?._id ||
    project?.project?.id ||
    project?.projectId?._id ||
    project?.projectId?.id ||
    project?.projectId ||
    project?.recommendedTask?.projectId?._id ||
    project?.recommendedTask?.projectId?.id ||
    project?.recommendedTask?.projectId ||
    project?._id ||
    project?.id;

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

if "function getMissionCardProjectId(" not in text:
    anchor = "function getMissionProjectForAvatar(mission) {"
    if anchor not in text:
        raise SystemExit("❌ Could not find getMissionProjectForAvatar anchor. No changes written.")
    text = text.replace(anchor, helpers + "\n" + anchor, 1)
    print("✅ Added MissionCard direct readiness helpers.")
else:
    print("✅ Direct readiness helpers already exist.")

# 3) Scope changes inside MissionCard only.
marker = "export default function MissionCard"
start = text.find(marker)
if start == -1:
    raise SystemExit("❌ Could not find MissionCard export. No changes written.")

head = text[:start]
body = text[start:]

# Replace only the first projectId declaration inside MissionCard.
body, project_id_replacements = re.subn(
    r'const\s+projectId\s*=\s*.*?;',
    'const projectId = getMissionCardProjectId(project);',
    body,
    count=1,
    flags=re.S,
)

if project_id_replacements != 1:
    raise SystemExit("❌ Could not replace projectId declaration inside MissionCard. No changes written.")

# Insert hydration after currentPhase.
current_phase_line = "  const currentPhase = isThisShipping || isThisShipped ? phase : PHASES.IDLE;"
hydration_block = r'''
  const [readinessOverride, setReadinessOverride] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!projectId) {
      setReadinessOverride(null);
      return undefined;
    }

    async function loadMissionReadiness() {
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

    loadMissionReadiness();

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
'''

if "const [readinessOverride, setReadinessOverride]" not in body:
    if current_phase_line not in body:
        raise SystemExit("❌ Could not find currentPhase line. No changes written.")
    body = body.replace(current_phase_line, current_phase_line + "\n" + hydration_block, 1)
    print("✅ Added direct readiness hydration inside MissionCard.")
else:
    print("✅ Direct readiness hydration already exists.")

# 4) Force display values to read from renderProject.
replacements = {
    "const title = getDisplayTitle(project);": "const title = getDisplayTitle(renderProject);",
    "const subtitle = getDisplaySubtitle(project);": "const subtitle = getDisplaySubtitle(renderProject);",
    "const reason = getDisplayReason(project);": "const reason = getDisplayReason(renderProject);",
    "const progressValue = getProgressValue(project);": "const progressValue = getProgressValue(renderProject);",
    "const priorityLabel = getPriorityLabel(project);": "const priorityLabel = getPriorityLabel(renderProject);",
    "const isPriorityMission = isRecommendedTaskMission(project);": "const isPriorityMission = isRecommendedTaskMission(renderProject);",
}

for old, new in replacements.items():
    if old in body:
        body = body.replace(old, new, 1)
        print(f"✅ Replaced: {old}")
    elif new in body:
        print(f"✅ Already replaced: {new}")
    else:
        print(f"⚠️ Could not find either form: {old}")

text = head + body
path.write_text(text)

print("")
print("✅ MissionCard direct readiness patch complete.")
print("")
print("Inspect with:")
print('rg -n "getMissionCardProjectId|fetchMissionCardOverviewReadiness|readinessOverride|renderProject|progressValue|__missionCardDirectReadiness" src/components/home/MissionCard.jsx -C 6')
