import React, { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../../utils/telemetry";
import { buildKey, getComments, addComment } from "../../utils/kpi/comments";

/**
 * Drill-in modal for a KPI point with lightweight local comments.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - projectId?: string
 *  - metric: string
 *  - point: { t:number|Date|string, v:number, idx?:number, label?:string }
 *  - comments?: Array<{ text:string, at:number, author:string }>
 *  - onAddComment?: (text:string) => void  // parent-handled add (ProjectHome wires telemetry + storage)
 *  - author?: string                        // default "You"
 */
export default function KpiDetailModal({
  open = false,
  onClose,
  projectId,
  metric,
  point,
  comments,                 // optional; if provided, this is the source of truth
  onAddComment,             // optional; if provided, parent handles storage/telemetry
  author = "You",
}) {
  const [text, setText] = useState("");
  const [localItems, setLocalItems] = useState([]);
  const usingControlledComments = Array.isArray(comments);

  // Only needed when we self-manage comments
  const key = useMemo(() => {
    if (!projectId || !metric || !point?.t) return "";
    return buildKey({ projectId, metric, t: point.t });
  }, [projectId, metric, point?.t]);

  // A11y: focus management
  const containerRef = useRef(null);
  const firstRef = useRef(null);
  const prevFocusRef = useRef(null);

  // IDs for aria
  const titleId = useMemo(() => `kpi-title-${metric?.toString().replace(/\s+/g, "-")}-${point?.idx ?? "x"}`, [metric, point?.idx]);
  const descId = `${titleId}-desc`;

  // Load comments when opened + focus handling
  useEffect(() => {
    if (!open) {
      // restore focus to the invoker
      setTimeout(() => prevFocusRef.current?.focus?.(), 0);
      return;
    }
    prevFocusRef.current = document.activeElement;
    setText("");
    setTimeout(() => firstRef.current?.focus(), 10);

    if (usingControlledComments) {
      setLocalItems(comments || []);
    } else if (key) {
      setLocalItems(getComments(key));
    } else {
      setLocalItems([]);
    }

    // ESC to close
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);

    // Focus trap
    const el = containerRef.current;
    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const onTrap = (e) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(el.querySelectorAll(selectors)).filter(
        (n) => !n.hasAttribute("disabled")
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
    el?.addEventListener("keydown", onTrap);

    return () => {
      window.removeEventListener("keydown", onKey);
      el?.removeEventListener("keydown", onTrap);
    };
  }, [open, key, comments, usingControlledComments, onClose]);

  // Keep local mirror up-to-date if parent controls comments
  useEffect(() => {
    if (usingControlledComments) setLocalItems(comments || []);
  }, [comments, usingControlledComments]);

  if (!open) return null;

  const dateLabel = (() => {
    const d = new Date(point?.t || Date.now());
    return d.toLocaleString();
  })();

  const submit = (e) => {
    e?.preventDefault?.();
    const raw = String(text || "").trim();
    if (!raw) return;

    const baseProps = {
      projectId: projectId || null,
      metric,
      t: point?.t ?? null,
      v: point?.v ?? null,
      source: usingControlledComments ? "parent" : "local",
    };

    // If parent provided a handler, delegate (it will update `comments` prop + do telemetry)
    if (typeof onAddComment === "function") {
      onAddComment(raw);
      // optimistic UX: append locally so it shows immediately
      setLocalItems((prev) => [...prev, { text: raw, at: Date.now(), author }]);
      setText("");
      try { track("kpi_comment_added", { ...baseProps, length: raw.length }); } catch {}
      return;
    }

    // Otherwise, store locally ourselves
    if (key) {
      addComment(key, { text: raw, at: Date.now(), author });
      setLocalItems(getComments(key));
      setText("");
      try { track("kpi_comment_added", { ...baseProps, length: raw.length }); } catch {}
    }
  };

  return (
    <>
      <div className="kpi-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="kpi-modal"
      >
        <div className="kpi-modal__header">
          <div className="kpi-modal__title">
            <div id={titleId} className="kpi-modal__metric">
              {metric}
            </div>
            <div className="kpi-modal__date">{dateLabel}</div>
          </div>
          <button className="kpi-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <p id={descId} className="sr-only">
          Value details and comments for this KPI point. Press Escape to close.
        </p>

        <div className="kpi-modal__value">{Number(point?.v ?? 0).toLocaleString()}</div>

        <div className="kpi-modal__comments">
          <div className="kpi-modal__comments-title">Comments</div>
          {localItems.length === 0 ? (
            <div className="kpi-modal__comments-empty">No comments yet.</div>
          ) : (
            <ul className="kpi-modal__comments-list">
              {localItems.map((c, i) => (
                <li key={i} className="kpi-modal__comment">
                  <div className="kpi-modal__comment-meta">
                    <span className="kpi-modal__comment-author">{c.author || "User"}</span>
                    <span className="kpi-modal__comment-time">
                      {new Date(c.at || Date.now()).toLocaleString()}
                    </span>
                  </div>
                  <div className="kpi-modal__comment-text">{c.text}</div>
                </li>
              ))}
            </ul>
          )}

          <form className="kpi-modal__form" onSubmit={submit}>
            <input
              ref={firstRef}
              className="kpi-modal__input"
              placeholder="Add a note…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="kpi-modal__btn">Add</button>
          </form>
        </div>
      </div>
    </>
  );
}
