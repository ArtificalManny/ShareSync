import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { summarizeConversation } from "../../api/chat";           // phase-2 endpoint you added earlier
import { useChat } from "../../context/ChatContext.jsx";          // to post the returned summary as a message
import { trackChatSummarized } from "../../utils/telemetry";

/**
 * ChatSummaryButton
 * Calls server summarizer for a conversation and posts the returned summary
 * as a new message (system-styled). Emits telemetry.
 *
 * Props:
 * - convoId: string (required)
 * - className?: string
 * - size?: 'sm' | 'md'
 * - onPosted?: (messageText: string) => void
 */
export default function ChatSummaryButton({ convoId, className = "", size = "sm", onPosted }) {
  const chat = useChat();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    if (!convoId || !chat) return;
    setErr("");
    setBusy(true);
    try {
      // 1) Ask backend to summarize this conversation
      const { summary } = await summarizeConversation(convoId); // expect { summary: "..." }
      const text = (summary || "").trim();
      if (!text) throw new Error("Summarizer returned no text.");

      // 2) Post summary back into the convo (best-effort)
      // Prefer a system flag in your message payload if BE supports it.
      await chat.sendMessage?.(convoId, { text, meta: { kind: "summary" } });

      // 3) Telemetry
      try { trackChatSummarized?.({ convoId, chars: text.length }); } catch {}

      onPosted?.(text);
    } catch (e) {
      setErr(e?.message || "Failed to summarize conversation.");
    } finally {
      setBusy(false);
      // auto-clear error after a short delay
      if (err) setTimeout(() => setErr(""), 2500);
    }
  };

  const pad = size === "md" ? "px-3 py-2 text-sm" : "px-2 py-1.5 text-xs";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={run}
        disabled={busy || !convoId}
        className={`inline-flex items-center gap-1 rounded-lg border border-border bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 ${pad}`}
        aria-label="Summarize chat"
        title="Summarize chat"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
        {size === "md" ? "Summarize" : "Summary"}
      </button>
      {err ? (
        <span className="text-[11px] text-rose-600" role="status" aria-live="assertive">
          {err}
        </span>
      ) : null}
    </div>
  );
}
