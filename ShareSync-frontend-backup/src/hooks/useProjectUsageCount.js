import { useCallback, useEffect, useState } from "react";

function getAuthToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function normalizeProjects(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export function useProjectUsageCount({ refreshMs = 30000 } = {}) {
  const [projectCount, setProjectCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const token = getAuthToken();

      const res = await fetch("/api/projects", {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!res.ok) {
        throw new Error(`Project count request failed with ${res.status}`);
      }

      const payload = await res.json();
      const projects = normalizeProjects(payload);

      setProjectCount(projects.length);
      setError("");
    } catch (err) {
      console.warn("[useProjectUsageCount] Failed to load project count:", err);
      setError(err?.message || "Failed to load project count");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, refreshMs);

    const events = [
      "projectCreated",
      "projectUpdated",
      "projectDeleted",
      "projectCompleted",
      "project:created",
      "project:updated",
      "project:deleted",
      "project:completed",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, refresh);
    });

    return () => {
      clearInterval(interval);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, refresh);
      });
    };
  }, [refresh, refreshMs]);

  return {
    projectCount,
    loading,
    error,
    refresh,
  };
}
