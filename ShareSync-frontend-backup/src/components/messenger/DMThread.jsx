import { toast } from "../ui/Toast";
// /src/components/messenger/DMThread.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Smile } from "lucide-react";
import { useChat } from "../../context/ChatContext.jsx";

/**
 * DMThread
 * - Renders the active conversation thread with a composer.
 * - Announces new messages in an aria-live region.
 * - Minimal reactions/typing are omitted for MVP; can be added later.
 */
export default function DMThread() {
  const { ready, activeId, threads, conversations, meId, actions } = useChat();
  const thread = threads[activeId] || { items: [], loading: false };
  const messagesEndRef = useRef(null);
  const liveRef = useRef(null);
  const [text, setText] = useState("");

  // active conversation meta
  const convo = useMemo(
    () => (conversations || []).find((c) => String(c.id || c._id) === String(activeId)),
    [conversations, activeId]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
    } catch {}
  }, [thread.items.length, activeId]);

  // Announce last message for screen readers (polite)
  useEffect(() => {
    if (!thread.items.length) return;
    const last = thread.items[thread.items.length - 1];
    const who = String(last.authorId) === String(meId) ? "You" : (last.authorName || "Teammate");
    const msg = `${who} said: ${last.text || "Attachment"}`;
    try {
      if (liveRef.current) {
        liveRef.current.textContent = msg;
      }
    } catch {}
  }, [thread.items.length, meId]);

  const onSend = async () => {
    const trimmed = String(text || "").trim();
    if (!trimmed || !activeId) return;
    const t = trimmed;
    setText("");
    try {
      await actions?.send?.(activeId, { text: t });
    } catch (e) {
      // Soft-error UI
      toast.error('Failed to send message', { description: e?.message || 'Please try again', duration: 3000 });
    }
  };

  if (!ready) {
    return (
      <div className="h-full grid place-items-center text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!activeId) {
    return (
      <div className="h-full grid place-items-center text-sm text-slate-500">
        Select a conversation to start chatting.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Titlebar */}
      <div className="h-11 px-3 border-b border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {convo?.title ||
            convo?.name ||
            convo?.otherUser?.displayName ||
            convo?.otherUser?.username ||
            (convo?.kind === "project" ? convo?.projectTitle || "Project chat" : "Direct message")}
        </div>
      </div>

      {/* Messages list */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        role="log"
        aria-live="off"
        aria-relevant="additions"
      >
        {thread.items.length === 0 && (
          <div className="text-xs text-slate-500">No messages yet. Say hi!</div>
        )}

        {thread.items.map((m) => {
          const mine = String(m.authorId) === String(meId);
          return (
            <div
              key={String(m.id || m._id)}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                mine
                  ? "ml-auto bg-indigo-600 text-white"
                  : "mr-auto bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              }`}
            >
              {!mine && (
                <div className="text-[11px] opacity-70 mb-0.5">
                  {m.authorName || "Teammate"}
                </div>
              )}
              <div>{m.text}</div>
              {m.__optimistic && (
                <div className="mt-1 text-[10px] opacity-70">Sending…</div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Live region (SR only) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      {/* Composer */}
      <div className="p-2 border-t border-slate-200/70 dark:border-slate-700">
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 dark:border-slate-700 h-9 w-9 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Insert emoji (coming soon)"
          >
            <Smile className="w-4 h-4 text-slate-500" />
          </button>
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === "NumpadEnter") && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Message…"
            className="flex-1 resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
            disabled={!text.trim()}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Press <kbd className="px-1 rounded border border-slate-300">Enter</kbd> to send &middot; <kbd className="px-1 rounded border border-slate-300">Shift</kbd>+<kbd className="px-1 rounded border border-slate-300">Enter</kbd> for a new line
        </div>
      </div>
    </div>
  );
}
