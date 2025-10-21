// usePresence(roomId): minimal client-side presence with optional server fetch.
// - Heartbeat every 30s updates your own lastSeen and emits a window event.
// - Tries GET /api/presence/:roomId (soft-fail); otherwise keeps only self.
// - Exposes: { onlineMap, isOnline(userId), lastSeen(userId) }
// - NEW: Adds focus awareness: { isFocusing, focusProjectId, focusEndsAt, startFocus(), stopFocus() }

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../AuthContext";
import {
  subscribe,
  setLastSeen,
  getPresence,
  isOnline as stateIsOnline,
  lastSeen as stateLastSeen,
} from "../state/presence";

const HEARTBEAT_MS = 30_000;

// Focus session defaults (25 minutes)
const FOCUS_MINUTES = 25;
const FOCUS_MS = FOCUS_MINUTES * 60_000;

// Session storage keys for cross-reload continuity
const FOCUS_SKEY = "ss.focus.active";
const FOCUS_PID  = "ss.focus.projectId";
const FOCUS_END  = "ss.focus.endsAt";

export default function usePresence(roomId) {
  const { user } = useContext(AuthContext) || {};
  const meId =
    user?._id || user?.id || user?.userId || user?.username || user?.email || "me";

  const [onlineMap, setOnlineMap] = useState(() => getPresence());
  const [focus, setFocus] = useState({ isFocusing: false, focusProjectId: null, endsAt: null });
  const focusTimerRef = useRef(null);

  // Subscribe to global presence updates
  useEffect(() => {
    return subscribe((snap) => setOnlineMap(snap));
  }, []);

  // Restore local focus state from sessionStorage on mount
  useEffect(() => {
    try {
      const active = sessionStorage.getItem(FOCUS_SKEY) === "1";
      const projectId = sessionStorage.getItem(FOCUS_PID) || null;
      const endsAt = Number(sessionStorage.getItem(FOCUS_END) || 0);
      if (active && endsAt && Date.now() < endsAt) {
        setFocus({ isFocusing: true, focusProjectId: projectId, endsAt });
        const msLeft = Math.max(0, endsAt - Date.now());
        focusTimerRef.current && clearTimeout(focusTimerRef.current);
        focusTimerRef.current = setTimeout(() => stopFocus(), msLeft);
      } else {
        sessionStorage.removeItem(FOCUS_SKEY);
        sessionStorage.removeItem(FOCUS_PID);
        sessionStorage.removeItem(FOCUS_END);
      }
    } catch {}
    return () => {
      focusTimerRef.current && clearTimeout(focusTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startFocus(projectId = roomId, minutes = FOCUS_MINUTES) {
    const endsAt = Date.now() + Math.max(1, minutes) * 60_000;
    setFocus({ isFocusing: true, focusProjectId: projectId || null, endsAt });
    try {
      sessionStorage.setItem(FOCUS_SKEY, "1");
      if (projectId) sessionStorage.setItem(FOCUS_PID, String(projectId));
      sessionStorage.setItem(FOCUS_END, String(endsAt));
    } catch {}

    focusTimerRef.current && clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => stopFocus(), Math.max(0, endsAt - Date.now()));

    try { window.dispatchEvent(new CustomEvent("presence:focus_started", { detail: { projectId, endsAt } })); } catch {}
  }

  function stopFocus() {
    setFocus({ isFocusing: false, focusProjectId: null, endsAt: null });
    try {
      sessionStorage.removeItem(FOCUS_SKEY);
      sessionStorage.removeItem(FOCUS_PID);
      sessionStorage.removeItem(FOCUS_END);
    } catch {}
    focusTimerRef.current && clearTimeout(focusTimerRef.current);
    try { window.dispatchEvent(new CustomEvent("presence:focus_ended")); } catch {}
  }

  // Initial fetch (optional) + heartbeat
  useEffect(() => {
    let ignore = false;

    async function fetchRoom() {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/presence/${encodeURIComponent(roomId)}`);
        if (!res.ok) throw new Error("Presence endpoint not available");
        const data = await res.json();
        // Normalize: either { users:[{userId,lastSeen}...] } or bare array
        const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
        list.forEach((u) => {
          if (u && u.userId) setLastSeen(u.userId, Number(u.lastSeen || Date.now()));
        });

        // Optional server focus payload normalization
        const focusObj = data?.focus || null;
        const active = typeof data?.isFocusing === "boolean" ? data.isFocusing : Boolean(focusObj?.active);
        const pid = data?.focusProjectId ?? focusObj?.projectId ?? null;
        const endsAt = Number(data?.focusEndsAt ?? focusObj?.endsAt ?? 0) || null;

        if (active) {
          setFocus({ isFocusing: true, focusProjectId: pid || roomId || null, endsAt });
          if (endsAt) {
            focusTimerRef.current && clearTimeout(focusTimerRef.current);
            const msLeft = Math.max(0, endsAt - Date.now());
            focusTimerRef.current = setTimeout(() => stopFocus(), msLeft);
          }
          try {
            sessionStorage.setItem(FOCUS_SKEY, "1");
            if (pid) sessionStorage.setItem(FOCUS_PID, String(pid));
            if (endsAt) sessionStorage.setItem(FOCUS_END, String(endsAt));
          } catch {}
        }
      } catch {
        // Soft fallback: ensure at least self is present
        setLastSeen(meId);
      }
    }

    // Do an immediate self mark + optional fetch
    setLastSeen(meId);
    fetchRoom();

    // Heartbeat
    const tick = () => {
      try {
        window.dispatchEvent(new CustomEvent("presence:heartbeat"));
      } catch {}
      setLastSeen(meId);
    };
    const id = setInterval(tick, HEARTBEAT_MS);
    const t0 = setTimeout(tick, 250);

    return () => {
      clearInterval(id);
      clearTimeout(t0);
      ignore = true;
    };
  }, [roomId, meId]);

  // Listen for app-level focus start/stop events (local fallback)
  useEffect(() => {
    const startEvents = ["start-tenx-sprint", "focus:started", "tenx-sprint:started"];
    const stopEvents  = ["focus:ended", "tenx-sprint:ended", "focus:stop", "stop-tenx-sprint"];

    const onStart = (e) => {
      const projectId = e?.detail?.projectId ?? roomId ?? null;
      const minutes = e?.detail?.minutes ?? FOCUS_MINUTES;
      startFocus(projectId, minutes);
    };
    const onStop = () => stopFocus();

    startEvents.forEach((n) => window.addEventListener(n, onStart));
    stopEvents.forEach((n)  => window.addEventListener(n, onStop));
    return () => {
      startEvents.forEach((n) => window.removeEventListener(n, onStart));
      stopEvents.forEach((n)  => window.removeEventListener(n, onStop));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const isOnline = useCallback((uid, opts) => stateIsOnline(uid, opts), [onlineMap]);
  const lastSeen = useCallback((uid) => stateLastSeen(uid), [onlineMap]);

  // Expose raw map (userId -> lastSeenMs) for simple dot UIs
  const map = useMemo(() => onlineMap, [onlineMap]);

  return {
    onlineMap: map,
    isOnline,
    lastSeen,
    // focus extras
    isFocusing: Boolean(focus.isFocusing),
    focusProjectId: focus.focusProjectId,
    focusEndsAt: focus.endsAt,
    startFocus,
    stopFocus,
  };
}
