// /src/components/messenger/ProjectChatThread.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useChat } from "../../context/ChatContext.jsx";
import MessageItem from "./MessageItem.jsx";

/**
 * ProjectChatThread
 * Shows the single project-scoped conversation for a given projectId.
 * If a convo doesn't exist yet, provider will create it on first send.
 */
export default function ProjectChatThread({ projectId }) {
  const chat = useChat();
  if (!chat) return null;

  const {
    ensureProjectConversation,
    getProjectConversation,
    listMore,
    send,
    typing,
    presenceMap,
    byId,
    loadingConvos,
    loadingMsgs,
  } = chat;

  const convo = useMemo(() => getProjectConversation?.(projectId) || null, [getProjectConversation, projectId, byId]);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [convo?.messageIds?.length]);

  const onSend = async (e) => {
    e?.preventDefault?.();
    const t = text.trim();
    if (!t) return;
    try {
      const c = convo || (await ensureProjectConversation(projectId));
      await send(c.id, { text: t });
      setText("");
    } catch {
      /* surface error in provider or toast elsewhere */
    }
  };

  const othersTyping = typing[convo?.id || ""] || [];
  const presence = presenceMap[convo?.id || ""] || [];

  const messages = (convo?.messageIds || []).map((id) => chat.messagesById[id]).filter(Boolean);

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 h-[420px] flex flex-col">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        Project chat
        {loadingMsgs && <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />}
      </div>

      <div ref={listRef} className="mt-2 flex-1 overflow-auto space-y-2" role="list" aria-label="Project messages">
        {messages.map((m) => (
          <div role="listitem" key={m.id}>
            <MessageItem message={m} />
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      {othersTyping.length > 0 && (
        <div className="text-[11px] text-muted mt-1">
          {othersTyping.length === 1 ? "Someone is typing…" : "Several people are typing…"}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={onSend} className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the team…"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          aria-label="Message"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
          disabled={!text.trim()}
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
