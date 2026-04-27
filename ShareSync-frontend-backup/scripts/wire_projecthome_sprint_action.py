#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
PROJECT_HOME = ROOT / "src/pages/ProjectHome.jsx"

def backup(path: Path) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak-wire-sprint-action-{stamp}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    return backup_path

def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, found {count}. No changes were written."
        )
    return source.replace(old, new, 1)

def main():
    print("[wire_projecthome_sprint_action] starting")

    if not PROJECT_HOME.exists():
        raise FileNotFoundError(f"Missing file: {PROJECT_HOME}")

    source = PROJECT_HOME.read_text(encoding="utf-8")

    original = source

    # -------------------------------------------------------------------------
    # 1. Add safe auth/header helpers near the existing utility helpers.
    #    This avoids importing unknown API clients and keeps the patch isolated.
    # -------------------------------------------------------------------------
    helper_anchor = '''function readNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function humanizeEnum(value) {'''

    helper_replacement = '''function readNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getStoredAuthToken() {
  if (typeof window === "undefined") return "";

  const tokenKeys = [
    "authToken",
    "accessToken",
    "token",
    "jwt",
    "openShareToken",
    "shareSyncToken",
  ];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }

  try {
    const authRaw = window.localStorage.getItem("auth");
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      return (
        parsed?.accessToken ||
        parsed?.authToken ||
        parsed?.token ||
        parsed?.jwt ||
        ""
      );
    }
  } catch {
    // Ignore malformed localStorage auth payloads.
  }

  try {
    const userRaw = window.localStorage.getItem("user");
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      return (
        parsed?.accessToken ||
        parsed?.authToken ||
        parsed?.token ||
        parsed?.jwt ||
        ""
      );
    }
  } catch {
    // Ignore malformed localStorage user payloads.
  }

  return "";
}

function buildJsonHeaders() {
  const token = getStoredAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readApiJson(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function buildDefaultSprintPayload(projectName) {
  const now = new Date();
  const end = addDays(now, 14);

  return {
    title: "Sprint 1",
    goal: `Build momentum on ${projectName || "this project"}`,
    startDate: toIsoDateOnly(now),
    endDate: toIsoDateOnly(end),
    status: "active",
  };
}

async function createProjectSprint(projectId, payload) {
  const encodedProjectId = encodeURIComponent(projectId);

  const response = await fetch(`/api/projects/${encodedProjectId}/sprints`, {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readApiJson(response);

  if (!response.ok) {
    const message =
      data?.normalizedMessage ||
      data?.message ||
      data?.error ||
      `Sprint request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function humanSprintError(error) {
  if (error?.status === 401) {
    return "You may need to sign in again before starting a sprint.";
  }

  if (error?.status === 403) {
    return "You do not appear to have permission to start a sprint for this project.";
  }

  if (error?.status === 404) {
    return "The sprint backend route is not available yet: POST /api/projects/:projectId/sprints.";
  }

  if (error?.status === 409) {
    return "This project already has an active sprint. Refreshing the overview should show it.";
  }

  return error?.message || "Unknown sprint error.";
}

function humanizeEnum(value) {'''

    source = replace_once(
        source,
        helper_anchor,
        helper_replacement,
        "utility helper insertion point before humanizeEnum"
    )

    # -------------------------------------------------------------------------
    # 2. Add a small busy state for Sprint creation.
    # -------------------------------------------------------------------------
    state_anchor = '''  const [showCompleteProjectModal, setShowCompleteProjectModal] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isReopeningProject, setIsReopeningProject] = useState(false);'''

    state_replacement = '''  const [showCompleteProjectModal, setShowCompleteProjectModal] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isReopeningProject, setIsReopeningProject] = useState(false);
  const [isStartingSprint, setIsStartingSprint] = useState(false);'''

    source = replace_once(
        source,
        state_anchor,
        state_replacement,
        "sprint busy state insertion"
    )

    # -------------------------------------------------------------------------
    # 3. Replace the current placeholder Sprint handler.
    # -------------------------------------------------------------------------
    old_handler = '''  const handleSprintAction = useCallback(
    (action) => {
      if (action === "start") {
        console.log("Start sprint");
      } else if (action === "continue") {
        navigate(`/projects/${id}/sprint`);
      } else if (action === "review") {
        console.log("Review sprint");
      }
    },
    [navigate, id]
  );'''

    new_handler = '''  const handleSprintAction = useCallback(
    async (action) => {
      if (!id) return;

      if (action === "start") {
        if (isStartingSprint) return;

        try {
          setIsStartingSprint(true);

          const payload = buildDefaultSprintPayload(project?.name);
          await createProjectSprint(id, payload);

          await refresh?.();
          await refreshSilently?.();

          setPulseRefreshKey((k) => k + 1);

          toast({
            title: "Sprint started",
            description: "Your 2-week execution cycle is now active.",
            variant: "success",
          });
        } catch (e) {
          const description = humanSprintError(e);

          toast({
            title: "Sprint could not start",
            description,
            variant: "error",
          });

          console.warn("[ProjectHome] start sprint failed:", e);
        } finally {
          setIsStartingSprint(false);
        }

        return;
      }

      if (action === "continue") {
        navigate(`/projects/${id}/sprint`);
        return;
      }

      if (action === "review") {
        navigate(`/projects/${id}/sprint`);
      }
    },
    [
      id,
      isStartingSprint,
      navigate,
      project?.name,
      refresh,
      refreshSilently,
    ]
  );'''

    source = replace_once(
        source,
        old_handler,
        new_handler,
        "handleSprintAction placeholder replacement"
    )

    # -------------------------------------------------------------------------
    # 4. Pass the busy state into OverviewView. This does not require SprintCard
    #    to use it yet, but gives us a clean future path.
    # -------------------------------------------------------------------------
    overview_signature_anchor = '''  onReopenProject,
  isReopeningProject,
  projectOnlineCount = 0,
}) {'''

    overview_signature_replacement = '''  onReopenProject,
  isReopeningProject,
  isStartingSprint = false,
  projectOnlineCount = 0,
}) {'''

    source = replace_once(
        source,
        overview_signature_anchor,
        overview_signature_replacement,
        "OverviewView prop signature"
    )

    sprint_card_anchor = '''        <SprintCard sprint={overview?.sprint || sprint} onAction={onSprintAction} />'''

    sprint_card_replacement = '''        <SprintCard
          sprint={overview?.sprint || sprint}
          onAction={onSprintAction}
          isStarting={isStartingSprint}
        />'''

    source = replace_once(
        source,
        sprint_card_anchor,
        sprint_card_replacement,
        "SprintCard prop expansion"
    )

    overview_call_anchor = '''              isReopeningProject={isReopeningProject}
              projectOnlineCount={projectOnlineCount}
            />'''

    overview_call_replacement = '''              isReopeningProject={isReopeningProject}
              isStartingSprint={isStartingSprint}
              projectOnlineCount={projectOnlineCount}
            />'''

    source = replace_once(
        source,
        overview_call_anchor,
        overview_call_replacement,
        "OverviewView call prop insertion"
    )

    if source == original:
        raise RuntimeError("No changes detected. No file was written.")

    backup_path = backup(PROJECT_HOME)
    PROJECT_HOME.write_text(source, encoding="utf-8")

    print(f"[wire_projecthome_sprint_action] backup created: {backup_path}")
    print(f"[wire_projecthome_sprint_action] patched: {PROJECT_HOME}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "createProjectSprint|buildDefaultSprintPayload|handleSprintAction|isStartingSprint|/api/projects/.*/sprints|SprintCard" src/pages/ProjectHome.jsx -C 6')
    print("  git diff -- src/pages/ProjectHome.jsx")
    print("")
    print("Important:")
    print("  This wires the frontend to POST /api/projects/:projectId/sprints.")
    print("  If that backend route does not exist yet, the UI will show a clear toast instead of silently doing nothing.")

if __name__ == "__main__":
    main()
