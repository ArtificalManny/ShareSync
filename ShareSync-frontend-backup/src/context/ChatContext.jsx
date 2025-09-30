// /src/context/ChatContext.jsx
//
// Central chat state: conversations, messages, unread counts, active convo.
// Binds to socket events: "chat:message", "chat:typing", "chat:reaction", "chat:presence".
// Exposes actions: refreshConversations, openConversation, send, react, markRead, loadMoreMessages.
//
// Usage:
// <ChatProvider>
//   <App />
// </ChatProvider>
//
// const { state, actions } = useChat();
// state.activeId, state.conversations, state.messages[convoId]...
//
// Notes:
// - Works even if the backend endpoints are not fully implemented (fails gracefully).
// - Respects MESSENGER_V1 flag; provider stays inert if disabled.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

function byIdMap(arr = []) {
  const m = new Map();
  arr.forEach((x) => {
    const id = String(x?.id || x?._id || "");
    if (id) m.set(id, x);
  });
  return m;
}

export function ChatProvider({ children }) {
  const { user } = useContext(AuthContext) || {};
  const meId = user?._id || user?.id || null;

  // Inert provider if feature is disabled
  const enabled = !!MESSENGER_V1;
  const [ready, setReady] = useState(false);

  // Conversations list + quick lookups
  const [conversations, setConversations] = useState([]); // array
  const convoMap = useMemo(() => byIdMap(conversations), [conversations]);

  // Messages are kept per conversation id: { [convoId]: { items: [], nextCursor, loading } }
  const [threads, setThreads] = useState({});

  // Unread and presence
  const [unread, setUnread] = useState({}); // { [convoId]: count }
  const [presence, setPresence] = useState({}); // { [userId]: 'online'|'offline'|'away' }

  // Active conversation id (DM or project)
  const [activeId, setActiveId] = useState(null);

  // ---- Load conversations on mount ----
  const refreshConversations = useCallback(async () => {
    if (!enabled) return;
    const res = await listConversations({ limit: 50 });
    const rows = Array.isArray(res?.items) ? res.items : [];
    setConversations(rows);

    // Best-effort unread bootstrap if BE provides counts
    const counts = {};
    rows.forEach((c) => {
      const id = String(c.id || c._id || "");
      if (!id) return;
      const n = Number(c.unread || c.unreadCount || 0);
      if (n > 0) counts[id] = n;
    });
    setUnread(counts);
    setReady(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refreshConversations();
  }, [enabled, refreshConversations]);

  // ---- Load messages for a conversation ----
  const ensureThread = useCallback(async (convoId) => {
    if (!enabled || !convoId) return;
    setThreads((prev) => {
      if (prev[convoId]) return prev;
      return { ...prev, [convoId]: { items: [], nextCursor: null, loading: true } };
    });
    const res = await listMessages(convoId, { limit: 30 });
    setThreads((prev) => ({
      ...prev,
      [convoId]: {
        items: Array.isArray(res?.items) ? res.items : [],
        nextCursor: res?.nextCursor || null,
        loading: false,
      },
    }));
  }, [enabled]);

  const loadMoreMessages = useCallback(async (convoId) => {
    const t = threads[convoId];
    if (!enabled || !convoId || !t || !t.nextCursor || t.loading) return;
    setThreads((prev) => ({ ...prev, [convoId]: { ...prev[convoId], loading: true } }));
    const res = await listMessages(convoId, { cursor: t.nextCursor, limit: 30 });
    setThreads((prev) => ({
      ...prev,
      [convoId]: {
        items: [...(prev[convoId]?.items || []), ...(res?.items || [])],
        nextCursor: res?.nextCursor || null,
        loading: false,
      },
    }));
  }, [threads, enabled]);

  // ---- Open a conversation (set active & load) ----
  const openConversation = useCallback(async (convoId) => {
    if (!enabled) return;
    if (!convoId) return;
    setActiveId(convoId);
    await ensureThread(convoId);
    // clear unread locally + inform server best-effort
    setUnread((prev) => {
      if (!prev[convoId]) return prev;
      const copy = { ...prev };
      delete copy[convoId];
      return copy;
    });
    apiMarkRead(convoId).catch(() => {});
  }, [enabled, ensureThread]);

  // ---- Create a conversation then open it ----
  const startConversation = useCallback(async ({ kind = "dm", memberIds = [], projectId } = {}) => {
    if (!enabled) return null;
    const created = await createConversation({ kind, memberIds, projectId });
    const id = String(created?.id || created?._id || "");
    if (id) {
      setConversations((prev) => {
        const exists = prev.some((c) => String(c.id || c._id) === id);
        return exists ? prev : [created, ...prev];
      });
      await openConversation(id);
      return created;
    }
    return null;
  }, [enabled, openConversation]);

  // ---- Send message (optimistic) ----
  const send = useCallback(async (convoId, { text, attachments } = {}) => {
    if (!enabled || !convoId) return null;
    const trimmed = String(text || "").trim();
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
      // Replace optimistic row
      setThreads((prev) => ({
        ...prev,
        [convoId]: {
          ...(prev[convoId] || { items: [] }),
          items: (prev[convoId]?.items || []).map((m) =>
            m.id === tempId ? created : m
          ),
          nextCursor: prev[convoId]?.nextCursor || null,
          loading: false,
        },
      }));
      try {
        const props = { convoId, hasAttachments: Boolean(attachments?.length) };
        trackChatMessage(props);
        if ((convoMap.get(convoId)?.kind || "dm") === "dm") {
          trackDmSent(props);
        }
      } catch {}
      return created;
    } catch (e) {
      // Rollback on error
      setThreads((prev) => ({
        ...prev,
        [convoId]: {
          ...(prev[convoId] || { items: [] }),
          items: (prev[convoId]?.items || []).filter((m) => m.id !== tempId),
          nextCursor: prev[convoId]?.nextCursor || null,
          loading: false,
        },
      }));
      throw e;
    }
  }, [enabled, meId, convoMap]);

  // ---- React to a message (optimistic count toggle) ----
  const react = useCallback(async (convoId, messageId, emoji) => {
    if (!enabled || !convoId || !messageId || !emoji) return { ok: false };
    // optimistic apply
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
    const res = await apiToggleReaction(convoId, messageId, emoji);
    try { trackChatReaction({ convoId, messageId, emoji, ok: res.ok }); } catch {}
    return res;
  }, [enabled, meId]);

  // ---- Mark read on active convo (call on focus/visible) ----
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

  // ---- Sockets: join user room for DMs; project rooms are set by consumers ----
  useSocket(meId ? `user:${meId}` : null, {
    userId: meId,
    onEvents: {
      // New message arrived
      "chat:message": (payload) => {
        const msg = payload?.message || payload;
        const convoId = String(msg?.convoId || payload?.convoId || "");
        if (!convoId) return;

        setThreads((prev) => {
          const t = prev[convoId] || { items: [], nextCursor: null, loading: false };
          // De-dup by id
          const exists = t.items.some((m) => String(m.id || m._id) === String(msg.id || msg._id));
          const items = exists ? t.items : [...t.items, msg];
          return { ...prev, [convoId]: { ...t, items } };
        });

        // If not active, bump unread
        if (convoId !== activeId) {
          setUnread((prev) => ({ ...prev, [convoId]: (prev[convoId] || 0) + 1 }));
        } else {
          // active: mark read server-side (best effort)
          apiMarkRead(convoId).catch(() => {});
        }
      },

      // Typing indicator
      "chat:typing": (payload) => {
        // Example payload: { convoId, userId, isTyping }
        // You can wire this into UI as desired. For now we keep minimal/no-op.
        // Option: store a small map per convo for currently typing users with timeouts.
      },

      // Reaction updates (server source of truth)
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
            else set.add(who); // add/toggle
            reactions[emoji] = Array.from(set);
            return { ...m, reactions };
          });
          return { ...prev, [convoId]: { ...t, items } };
        });
      },

      // Presence signals
      "chat:presence": (payload) => {
        const { userId: uid, state } = payload || {};
        if (!uid) return;
        setPresence((p) => ({ ...p, [uid]: state || "online" }));
      },
    },
  });

  // Mark active convo read when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") markReadActive();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markReadActive]);

  // Public API
  const value = useMemo(() => {
    return {
      enabled,
      ready,
      meId,
      conversations,
      unread,
      presence,
      activeId,
      threads, // { [convoId]: { items, nextCursor, loading } }

      actions: {
        refreshConversations,
        openConversation,
        startConversation,
        loadMoreMessages,
        send,
        react,
        markReadActive,
        setActiveId, // exposed if you need to switch without loading immediately
        toggleMessenger: (open) => {
          try { trackMessengerToggled({ open: Boolean(open) }); } catch {}
        },
      },
    };
  }, [
    enabled,
    ready,
    meId,
    conversations,
    unread,
    presence,
    activeId,
    threads,
    refreshConversations,
    openConversation,
    startConversation,
    loadMoreMessages,
    send,
    react,
    markReadActive,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export default ChatProvider;
