import { useCallback, useRef, useState } from "react";
import { sendOrQueue } from "../utils/offlineQueue";

/**
 * Generic optimistic mutation helper.
 *
 * Usage:
 * const { mutate, pending, error } = useOptimisticMutation({
 *   // apply optimistic change and return a rollback function
 *   apply: () => {
 *     setList((prev) => [draftItem, ...prev]);
 *     return () => setList((prev) => prev.filter(x => x.tempId !== draftItem.tempId));
 *   },
 *   // request spec to send; if offline or network error → queued
 *   request: ({ vars }) => ({
 *     url: `/api/projects/${vars.projectId}/tasks`,
 *     method: "POST",
 *     body: vars.payload,
 *   }),
 *   onSuccess: (result) => {},
 *   onError: (err) => {},
 * });
 *
 * mutate({ projectId, payload })
 */
export default function useOptimisticMutation({
  apply,                     // () => rollbackFn
  request,                   // ({ vars }) => { url, method, body, headers? }
  onSuccess,                 // (res) => void
  onError,                   // (err) => void
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const lastRollback = useRef(null);

  const mutate = useCallback(async (vars) => {
    setPending(true);
    setError(null);

    // 1) Apply optimistic UI and keep rollback
    let rollback = null;
    try {
      rollback = typeof apply === "function" ? apply(vars) : null;
      lastRollback.current = rollback;
    } catch (e) {
      setPending(false);
      setError(e);
      onError?.(e);
      return { ok: false, error: e };
    }

    // 2) Attempt network, or queue if offline
    try {
      const spec = request?.({ vars }) || null;
      if (!spec || !spec.url || !spec.method) throw new Error("Invalid request spec");

      const res = await sendOrQueue(spec);
      // If queued → we treat as success for the UI, to keep it snappy
      if (res.queued) {
        setPending(false);
        onSuccess?.({ queued: true, offline: true });
        return { ok: true, queued: true };
      }

      setPending(false);
      onSuccess?.({ queued: false, offline: false });
      return { ok: true };
    } catch (e) {
      // 3) Rollback on hard error (not queued)
      try { typeof rollback === "function" && rollback(); } catch {}
      setPending(false);
      setError(e);
      onError?.(e);
      return { ok: false, error: e };
    }
  }, [apply, request, onSuccess, onError]);

  return { mutate, pending, error };
}
