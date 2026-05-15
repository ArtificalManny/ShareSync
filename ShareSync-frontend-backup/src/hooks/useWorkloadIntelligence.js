// src/hooks/useWorkloadIntelligence.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getWorkloadIntelligence } from "../api/workloadIntelligence";

export function useWorkloadIntelligence({ refreshMs = 30000 } = {}) {
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);

  const [state, setState] = useState({
    data: null,
    loading: true,
    error: "",
    updatedAt: null,
  });

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;

    setState((previous) => ({
      ...previous,
      loading: !previous.data,
      error: "",
    }));

    try {
      const data = await getWorkloadIntelligence();

      if (!mountedRef.current) return;

      if (typeof window !== "undefined") {
        window.__workloadIntel = data;
      }

      setState({
        data,
        loading: false,
        error: "",
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (!mountedRef.current) return;

      const message =
        error?.response?.data?.message ||
        error?.normalizedMessage ||
        error?.message ||
        "Failed to load workload intelligence";

      console.warn("[useWorkloadIntelligence] refresh failed:", message);

      setState((previous) => ({
        ...previous,
        loading: false,
        error: message,
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!refreshMs || refreshMs <= 0) return undefined;

    const interval = window.setInterval(() => {
      refresh();
    }, refreshMs);

    return () => window.clearInterval(interval);
  }, [refresh, refreshMs]);

  useEffect(() => {
    const events = [
      "local-ship",
      "project:shipped",
      "project.ship.posted",
      "task:completed",
      "task_completed",
      "activity:created",
      "visibilitychange",
      "focus",
    ];

    const handler = () => {
      if (document.visibilityState && document.visibilityState !== "visible") return;
      refresh();
    };

    events.forEach((eventName) => window.addEventListener(eventName, handler));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handler));
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
