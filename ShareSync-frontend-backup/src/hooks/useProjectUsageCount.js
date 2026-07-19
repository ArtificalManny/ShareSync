import { useCallback, useEffect, useState } from "react";

function getAuthToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function normalizeProjectCount(payload) {
  const rawCount =
    payload?.data?.usage?.projects ??
    payload?.usage?.projects ??
    null;

  const count = Number(rawCount);

  if (!Number.isFinite(count) || count < 0) {
    return null;
  }

  return count;
}

export function useProjectUsageCount({
  refreshMs = 30000,
} = {}) {
  const [projectCount, setProjectCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(
        "/api/subscriptions/current",
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      if (!response.ok) {
        throw new Error(
          `Project usage request failed with ${response.status}`,
        );
      }

      const payload = await response.json();
      const nextCount = normalizeProjectCount(payload);

      if (nextCount === null) {
        throw new Error(
          "Subscription response did not contain project usage",
        );
      }

      setProjectCount(nextCount);
      setError("");
    } catch (err) {
      console.warn(
        "[useProjectUsageCount] Failed to load project usage:",
        err,
      );

      setError(
        err?.message || "Failed to load project usage",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, refreshMs);

    const events = [
      "projectCreated",
      "projectDeleted",
      "project:created",
      "project:deleted",
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
