import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import DMList from "../components/messenger/DMList.jsx";
import DMThread from "../components/messenger/DMThread.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle";

/**
 * DMPage
 * Full-page DM experience, routes: /messages and /messages/:id
 * - Left: list of conversations
 * - Right: active thread (follows :id or context.activeId)
 * A11y:
 * - aria-live region announces new messages
 * - Basic focus trap within the page container
 * - ESC navigates back
 */
export default function DMPage() {
  useDocumentTitle("Messages");
  const chat = useChat();
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  // Guard when ChatProvider isn’t mounted yet
  if (!chat) {
    return (
      <main id="main" role="main" tabIndex={-1} className="with-sidebar px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-sm text-slate-500">Messenger is unavailable.</div>
      </main>
    );
  }

  const {
    enabled,
    ready,
    conversations = [],
    unread = {},
    activeId,
    actions = {},
    messages = {},          // map: { [convoId]: Message[] } if your context exposes it
  } = chat;

  // Keep context and route in sync
  useEffect(() => {
    if (!enabled || !ready) return;
    if (routeId && routeId !== activeId) {
      actions.openConversation?.(routeId);
    }
    // If no id in URL but we have an activeId, reflect it to the URL
    if (!routeId && activeId) {
      navigate(`/messages/${activeId}`, { replace: true });
    }
  }, [enabled, ready, routeId, activeId, actions, navigate]);

  // ESC → back
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Focus trap (keeps tab focus within the page’s main container)
  const containerRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const selector = 'a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(el.querySelectorAll(selector)).filter(
        (n) => !n.hasAttribute("disabled") && !n.getAttribute("aria-hidden")
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, []);

  // Live region for new messages in active thread
  const [liveText, setLiveText] = useState("");
  const lastCountRef = useRef(0);
  const currentMessages = useMemo(() => messages[activeId] || [], [messages, activeId]);

  useEffect(() => {
    const count = currentMessages.length;
    if (count > lastCountRef.current) {
      const delta = count - lastCountRef.current;
      setLiveText(`${delta} new message${delta > 1 ? "s" : ""}`);
    }
    lastCountRef.current = count;
    // Clear politely after a moment
    if (liveText) {
      const t = setTimeout(() => setLiveText(""), 1200);
      return () => clearTimeout(t);
    }
  }, [currentMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled) {
    return (
      <main id="main" role="main" tabIndex={-1} className="with-sidebar px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-sm text-slate-500">Messaging is disabled.</div>
      </main>
    );
  }

  return (
    <main
      id="main"
      role="main"
      tabIndex={-1}
      ref={containerRef}
      className="with-sidebar px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveText}
      </div>

      <div className="max-w-6xl mx-auto rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 h-[min(70vh,720px)]">
          {/* List */}
          <aside className="col-span-4 border-r border-border overflow-y-auto">
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
                onSelect={(id) => {
                  actions.openConversation?.(id);
                  if (id) navigate(`/messages/${id}`);
                }}
                onNewDM={() => actions.startConversation?.({ kind: "dm", memberIds: [] })}
              />
            )}
          </aside>

          {/* Thread */}
          <section className="col-span-8">
            <DMThread />
          </section>
        </div>
      </div>
    </main>
  );
}
