// /src/context/ChatContext.jsx
//
// Central chat state: conversations, messages, unread counts, active convo.
// Binds to socket events: "chat:message", "chat:typing", "chat:reaction", "chat:presence".
// Exposes actions: refreshConversations, openConversation, send, react, markRead, loadMoreMessages.
//
// Works even if the backend endpoints are not fully implemented (fails gracefully).
// Respects MESSENGER_V1 flag + env VITE_MESSAGES_ENABLED + localStorage dev override "ss:features:messages".
// Compatible with both legacy consumers (messages[convoId]) and new ones (threads[convoId]).

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  
  import { AuthContext } from "../AuthContext";
  import useSocket from "../hooks/useSocket";
  
  import {
    listConversations,
    createConversation,
    listMessages,
    sendMessage as apiSendMessage,
    toggleReaction as apiToggleReaction,
    markRead as apiMarkRead,
  } from "../api/chat";
  
  import {
    trackDmSent,
    trackChatMessage,
    trackChatReaction,
    trackMessengerToggled,
  } from "../utils/telemetry";
  
  import { MESSENGER_V1 } from "../config/flags";
  
  const ChatContext = createContext(null);
  export function useChat() {
    return useContext(ChatContext);
  }
  
  // ---- helpers ----
  function byIdMap(arr = []) {
    const m = new Map();
    for (const x of arr) {
      const id = String(x?.id || x?._id || "");
      if (id) m.set(id, x);
    }
    return m;
  }
  
  // compute feature flag from multiple sources
  function computeEnabled(explicit) {
    if (typeof explicit === "boolean") return explicit; // prop wins
    const envOn = import.meta?.env?.VITE_MESSAGES_ENABLED === "true";
    const lsOn =
      typeof window !== "undefined" &&
      localStorage.getItem("ss:features:messages") === "on";
    return Boolean(MESSENGER_V1 || envOn || lsOn);
  }
  
  /**
   * ChatProvider
   * props:
   *  - enabled?: boolean (optional override; otherwise flags decide)
   *  - userId?: string (optional override for meId)
   *  - user?: object  (optional; if not present uses AuthContext.user)
   */
  export function ChatProvider({ children, enabled: enabledProp, userId, user: userProp }) {
    const auth = useContext(AuthContext) || {};
    const user = userProp || auth.user || null;
    const meId = userId || user?._id || user?.id || null;
  
    // Feature flag state (reacts to prop/env/localStorage changes)
    const [enabled, setEnabled] = useState(() => computeEnabled(enabledProp));
  
    useEffect(() => {
      // update if the prop changes
      setEnabled(computeEnabled(enabledProp));
    }, [enabledProp]);
  
    useEffect(() => {
      // update if the localStorage override flips (another tab or console)
      const onStorage = (e) => {
        if (e.key === "ss:features:messages") {
          setEnabled(computeEnabled(enabledProp));
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, [enabledProp]);
  
    // allow manual console toggle without reload:
    // localStorage.setItem('ss:features:messages','on'); location.reload();
  
    const [ready, setReady] = useState(false);
  
    // Conversations + quick lookup map
    const [conversations, setConversations] = useState([]);
    const convoMap = useMemo(() => byIdMap(conversations), [conversations]);
  
    // Threads: { [convoId]: { items: Message[], nextCursor, loading } }
    const [threads, setThreads] = useState({});
  
    // Legacy compatibility: derive messages map from threads
    const messages = useMemo(() => {
      const m = {};
      for (const [cid, t] of Object.entries(threads)) m[cid] = t?.items || [];
      return m;
    }, [threads]);
  
    // Unread and presence
    const [unread, setUnread] = useState({});    // { [convoId]: count }
    const [presence, setPresence] = useState({}); // { [userId]: 'online'|'offline'|'away' }
  
    // Which conversation is open
    const [activeId, setActiveId] = useState(null);
  
    // ============ bootstrap conversations ============
    const refreshConversations = useCallback(async () => {
      if (!enabled) {
        setReady(true);
        return;
      }
      try {
        const res = await listConversations({ limit: 50 });
        const rows = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        setConversations(rows);
  
        // best-effort unread
        const counts = {};
        for (const c of rows) {
          const id = String(c.id || c._id || "");
          if (!id) continue;
          const n = Number(c.unread ?? c.unreadCount ?? 0);
          if (n > 0) counts[id] = n;
        }
        setUnread(counts);
      } catch (e) {
        // Fail gracefully; still mark ready so UI can render an empty state.
        console.warn("[ChatProvider] listConversations failed:", e);
      } finally {
        setReady(true);
      }
    }, [enabled]);
  
    useEffect(() => {
      refreshConversations();
    }, [refreshConversations]);
  
    // ============ ensure/load thread ============
    const ensureThread = useCallback(
      async (convoId) => {
        if (!enabled || !convoId) return;
        setThreads((prev) => {
          if (prev[convoId]) return prev;
          return {
            ...prev,
            [convoId]: { items: [], nextCursor: null, loading: true },
          };
        });
        try {
          const res = await listMessages(convoId, { limit: 30 });
          setThreads((prev) => ({
            ...prev,
            [convoId]: {
              items: Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [],
              nextCursor: res?.nextCursor || null,
              loading: false,
            },
          }));
        } catch (e) {
          console.warn("[ChatProvider] listMessages failed:", e);
          setThreads((prev) => ({
            ...prev,
            [convoId]: {
              items: prev[convoId]?.items || [],
              nextCursor: null,
              loading: false,
            },
          }));
        }
      },
      [enabled]
    );
  
    const loadMoreMessages = useCallback(
      async (convoId) => {
        const t = threads[convoId];
        if (!enabled || !convoId || !t || !t.nextCursor || t.loading) return;
        setThreads((prev) => ({
          ...prev,
          [convoId]: { ...prev[convoId], loading: true },
        }));
        try {
          const res = await listMessages(convoId, {
            cursor: t.nextCursor,
            limit: 30,
          });
          setThreads((prev) => ({
            ...prev,
            [convoId]: {
              items: [...(prev[convoId]?.items || []), ...(res?.items || [])],
              nextCursor: res?.nextCursor || null,
              loading: false,
            },
          }));
        } catch (e) {
          console.warn("[ChatProvider] loadMoreMessages failed:", e);
          setThreads((prev) => ({
            ...prev,
            [convoId]: { ...prev[convoId], loading: false },
          }));
        }
      },
      [threads, enabled]
    );
  
    // ============ open/start ============
    const openConversation = useCallback(
      async (convoId) => {
        if (!enabled || !convoId) return;
        setActiveId(convoId);
        await ensureThread(convoId);
  
        // clear unread locally + best-effort server mark
        setUnread((prev) => {
          if (!prev[convoId]) return prev;
          const copy = { ...prev };
          delete copy[convoId];
          return copy;
        });
        apiMarkRead(convoId).catch(() => {});
      },
      [enabled, ensureThread]
    );
  
    const startConversation = useCallback(
      async ({ kind = "dm", memberIds = [], projectId } = {}) => {
        if (!enabled) return null;
        try {
          const created = await createConversation({ kind, memberIds, projectId });
          const id = String(created?.id || created?._id || "");
          if (!id) return null;
          setConversations((prev) => {
            const exists = prev.some((c) => String(c.id || c._id) === id);
            return exists ? prev : [created, ...prev];
          });
          await openConversation(id);
          return created;
        } catch (e) {
          console.warn("[ChatProvider] startConversation failed:", e);
          return null;
        }
      },
      [enabled, openConversation]
    );
  
    // ============ send / react ============
    const send = useCallback(
      async (convoId, { text, attachments } = {}) => {
        if (!enabled || !convoId) return null;
        const trimmed = String(text || "").trim();
        if (!trimmed) return null;
  
        const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const optimistic = {
          id: tempId,
          convoId,
          authorId: meId,
          text: trimmed,
          attachments: Array.isArray(attachments) ? attachments : [],
          createdAt: new Date().toISOString(),
          __optimistic: true,
        };
  
        setThreads((prev) => ({
          ...prev,
          [convoId]: {
            ...(prev[convoId] || { items: [], nextCursor: null, loading: false }),
            items: [...(prev[convoId]?.items || []), optimistic],
          },
        }));
  
        try {
          const created = await apiSendMessage(convoId, { text: trimmed, attachments });
          setThreads((prev) => ({
            ...prev,
            [convoId]: {
              ...(prev[convoId] || { items: [] }),
              items: (prev[convoId]?.items || []).map((m) => (m.id === tempId ? created : m)),
              nextCursor: prev[convoId]?.nextCursor || null,
              loading: false,
            },
          }));
          try {
            const props = { convoId, hasAttachments: Boolean(attachments?.length) };
            trackChatMessage(props);
            if ((convoMap.get(convoId)?.kind || "dm") === "dm") trackDmSent(props);
          } catch {}
          return created;
        } catch (e) {
          // rollback
          setThreads((prev) => ({
            ...prev,
            [convoId]: {
              ...(prev[convoId] || { items: [] }),
              items: (prev[convoId]?.items || []).filter((m) => m.id !== tempId),
              nextCursor: prev[convoId]?.nextCursor || null,
              loading: false,
            },
          }));
          console.warn("[ChatProvider] send failed:", e);
          return null;
        }
      },
      [enabled, meId, convoMap]
    );
  
    const react = useCallback(
      async (convoId, messageId, emoji) => {
        if (!enabled || !convoId || !messageId || !emoji) return { ok: false };
        // optimistic
        setThreads((prev) => {
          const t = prev[convoId];
          if (!t) return prev;
          const items = t.items.map((m) => {
            if (String(m.id || m._id) !== String(messageId)) return m;
            const reactions = { ...(m.reactions || {}) };
            const mine = new Set(reactions[emoji] || []);
            if (mine.has(meId)) mine.delete(meId);
            else mine.add(meId);
            reactions[emoji] = Array.from(mine);
            return { ...m, reactions };
          });
          return { ...prev, [convoId]: { ...t, items } };
        });
        try {
          const res = await apiToggleReaction(convoId, messageId, emoji);
          try {
            trackChatReaction({ convoId, messageId, emoji, ok: !!res?.ok });
          } catch {}
          return res;
        } catch {
          // swallow; server will correct on next fetch/socket
          return { ok: false };
        }
      },
      [enabled, meId]
    );
  
    // ============ read on focus/visible ============
    const markReadActive = useCallback(async () => {
      if (!activeId) return;
      setUnread((prev) => {
        if (!prev[activeId]) return prev;
        const copy = { ...prev };
        delete copy[activeId];
        return copy;
      });
      apiMarkRead(activeId).catch(() => {});
    }, [activeId]);
  
    useEffect(() => {
      const onVisible = () => {
        if (document.visibilityState === "visible") markReadActive();
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => document.removeEventListener("visibilitychange", onVisible);
    }, [markReadActive]);
  
    // ============ sockets ============
    useSocket(meId ? `user:${meId}` : null, {
      userId: meId,
      onEvents: {
        "chat:message": (payload) => {
          const msg = payload?.message || payload;
          const convoId = String(msg?.convoId || payload?.convoId || "");
          if (!convoId) return;
  
          setThreads((prev) => {
            const t = prev[convoId] || { items: [], nextCursor: null, loading: false };
            const exists = t.items.some(
              (m) => String(m.id || m._id) === String(msg.id || msg._id)
            );
            const items = exists ? t.items : [...t.items, msg];
            return { ...prev, [convoId]: { ...t, items } };
          });
  
          if (convoId !== activeId) {
            setUnread((prev) => ({ ...prev, [convoId]: (prev[convoId] || 0) + 1 }));
          } else {
            apiMarkRead(convoId).catch(() => {});
          }
        },
  
        "chat:typing": () => {
          // no-op; hook it up if/when UI is ready
        },
  
        "chat:reaction": (payload) => {
          const { convoId, messageId, emoji, userId: who, op } = payload || {};
          if (!convoId || !messageId || !emoji || !who) return;
  
          setThreads((prev) => {
            const t = prev[convoId];
            if (!t) return prev;
            const items = t.items.map((m) => {
              if (String(m.id || m._id) !== String(messageId)) return m;
              const reactions = { ...(m.reactions || {}) };
              const set = new Set(reactions[emoji] || []);
              if (op === "remove") set.delete(who);
              else set.add(who);
              reactions[emoji] = Array.from(set);
              return { ...m, reactions };
            });
            return { ...prev, [convoId]: { ...t, items } };
          });
        },
  
        "chat:presence": (payload) => {
          const { userId: uid, state } = payload || {};
          if (!uid) return;
          setPresence((p) => ({ ...p, [uid]: state || "online" }));
        },
      },
    });
  
    // Public API
    const value = useMemo(
      () => ({
        // state
        enabled,
        ready,
        meId,
        conversations,
        unread,
        presence,
        activeId,
        // Both for compatibility:
        messages, // legacy: { [convoId]: Message[] }
        threads,  // new:    { [convoId]: { items, nextCursor, loading } }
  
        // actions
        actions: {
          refreshConversations,
          openConversation,
          startConversation,
          loadMoreMessages,
          send,
          react,
          markReadActive,
          setActiveId, // exposed for route sync
          toggleMessenger: (open) => {
            try {
              trackMessengerToggled({ open: Boolean(open) });
            } catch {}
          },
        },
      }),
      [
        enabled,
        ready,
        meId,
        conversations,
        unread,
        presence,
        activeId,
        messages,
        threads,
        refreshConversations,
        openConversation,
        startConversation,
        loadMoreMessages,
        send,
        react,
        markReadActive,
      ]
    );
  
    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
  }
  
  export default ChatContext;
  