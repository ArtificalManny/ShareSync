// usePresence(roomId): minimal client-side presence with optional server fetch.
// - Heartbeat every 30s updates your own lastSeen and emits a window event.
// - Tries GET /api/presence/:roomId (soft-fail); otherwise keeps only self.
// - Exposes: { onlineMap, isOnline(userId), lastSeen(userId) }

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../AuthContext";
import {
  subscribe,
  setLastSeen,
  getPresence,
  isOnline as stateIsOnline,
  lastSeen as stateLastSeen,
} from "../state/presence";

const HEARTBEAT_MS = 30_000;

export default function usePresence(roomId) {
  const { user } = useContext(AuthContext) || {};
  const meId =
    user?._id || user?.id || user?.userId || user?.username || user?.email || "me";

  const [onlineMap, setOnlineMap] = useState(() => getPresence());

  // Subscribe to global presence updates
  useEffect(() => {
    return subscribe((snap) => setOnlineMap(snap));
  }, []);

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
    // also tick once shortly after mount to smooth initial state
    const t0 = setTimeout(tick, 250);

    return () => {
      clearInterval(id);
      clearTimeout(t0);
      ignore = true;
    };
  }, [roomId, meId]);

  const isOnline = useCallback((uid, opts) => stateIsOnline(uid, opts), [onlineMap]);
  const lastSeen = useCallback((uid) => stateLastSeen(uid), [onlineMap]);

  // Expose raw map (userId -> lastSeenMs) for simple dot UIs
  const map = useMemo(() => onlineMap, [onlineMap]);

  return { onlineMap: map, isOnline, lastSeen };
}
