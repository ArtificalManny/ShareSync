import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/habits";
import useSocket from "./useSocket";

export default function useHabitsData({ range = 14, room = "user:me", realtime = true } = {}) {
  const [data, setData] = useState({ cadence: null, momentum: [], loading: false, error: "" });
  const ctrlRef = useRef(null);

  const load = useCallback(async () => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setData((s) => ({ ...s, loading: true, error: "" }));
    try {
      const [cadence, momentum] = await Promise.all([
        api.getCadence({ range, signal: ctrl.signal }),
        api.getSprintMomentum({ range, signal: ctrl.signal }),
      ]);
      if (!ctrl.signal.aborted) setData({ cadence, momentum, loading: false, error: "" });
    } catch (e) {
      if (!ctrl.signal.aborted) setData((s) => ({ ...s, loading: false, error: e?.message || "Failed" }));
    }
  }, [range]);

  useEffect(() => {
    load();
    return () => ctrlRef.current?.abort?.();
  }, [load]);

  useSocket(realtime ? room : null, {
    onEvents: realtime ? {
      "activity:new": load,
      "sprint:finished": load,
      "tasks:completed": load,
    } : {},
  });

  return { ...data, reload: load };
}
