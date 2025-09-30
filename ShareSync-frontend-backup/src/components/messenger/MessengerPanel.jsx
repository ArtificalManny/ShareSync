import React, { useEffect, useMemo, useState } from "react";
import { MessageCircle, X, Loader2 } from "lucide-react";
import DMList from "./DMList.jsx";
import DMThread from "./DMThread.jsx";
import { useChat } from "../../context/ChatContext.jsx";

/**
 * MessengerPanel
 * Docked overlay panel (bottom-right).
 * Shows DM list + active thread. Toggle has unread badge.
 * Mount once near other global overlays.
 */
export default function MessengerPanel() {
  const chat = useChat();
  // If the provider isn't mounted, render nothing (prevents “useChat() is null” crashes).
  if (!chat) return null;

  const {
    enabled,
    ready,
    conversations = [],
    unread = {},
    activeId,
    actions = {},
  } = chat;

  if (!enabled) return null;

  // Local open/close state for the panel
  const [isOpen, setIsOpen] = useState(false);

  // Optional telemetry hook if your context exposes it
  useEffect(() => {
    try { actions.toggleMessenger?.(isOpen); } catch {}
  }, [isOpen, actions]);

  // Sum unread for badge
  const unreadTotal = useMemo(
    () => Object.values(unread).reduce((a, b) => a + Number(b || 0), 0),
    [unread]
  );

  const toggle = () => setIsOpen((o) => !o);

  return (
    <>
      {/* Toggle FAB */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close Messenger" : "Open Messenger"}
        className="fixed z-[52] right-4 bottom-20 inline-flex items-center justify-center rounded-full h-12 w-12 border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 shadow-lg hover:shadow-xl"
      >
        <MessageCircle className="w-6 h-6 text-indigo-600" />
        {unreadTotal > 0 && (
          <span
            aria-label={`${unreadTotal} unread`}
            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[11px] leading-[20px] text-center"
          >
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        )}
      </button>

      {/* Docked panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[50] bg-black/20 dark:bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Messenger"
            className="fixed z-[51] right-4 bottom-4 w-[min(900px,calc(100%-2rem))] h-[520px] rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="h-11 px-3 border-b border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Messages
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                aria-label="Close messenger"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Body: split list / thread */}
            <div className="h-[calc(520px-44px)] grid grid-cols-12">
              <aside className="col-span-4 border-r border-slate-200/70 dark:border-slate-700 overflow-y-auto">
                {!ready ? (
                  <div className="p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <DMList
                    conversations={conversations}
                    unread={unread}
                    activeId={activeId}
                    onSelect={(id) => actions.openConversation?.(id)}
                    onNewDM={() => actions.startConversation?.({ kind: "dm", memberIds: [] })}
                  />
                )}
              </aside>

              <section className="col-span-8">
                <DMThread />
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}