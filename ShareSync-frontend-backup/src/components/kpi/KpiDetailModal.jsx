import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildKey, getComments, addComment } from "../../utils/kpi/comments";
import { track } from "../../utils/telemetry";

export default function KpiDetailModal({
  open = false,
  onClose,
  onAddComment,           // (text) => void
  projectId,
  metric,                 // string label of the metric
  point,                  // { t, v, idx, label }
  author = "You",
}) {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);
  const key = useMemo(
    () => (projectId && metric && point?.t ? buildKey({ projectId, metric, t: point.t }) : ""),
    [projectId, metric, point?.t]
  );
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // fetch local comments
    if (key) setItems(getComments(key));
    setText("");
    setTimeout(() => firstRef.current?.focus(), 10);
    try {
      track("kpi_point_opened", {
        projectId,
        metric,
        t: point?.t ?? null,
        value: point?.v ?? null,
      });
    } catch {}
  }, [open, key, metric, projectId, point?.t, point?.v]);

  if (!open) return null;

  const dateLabel = (() => {
    const d = new Date(point?.t || Date.now());
    return d.toLocaleString();
  })();

  const submit = (e) => {
    e?.preventDefault?.();
    const raw = String(text || "").trim();
    if (!raw) return;
    const payload = { text: raw, at: Date.now(), author };
    addComment(key, payload);
    setItems(getComments(key));
    setText("");
    try { onAddComment?.(raw); } catch {}
    try {
      track("kpi_comment_added", {
        projectId,
        metric,
        t: point?.t ?? null,
        length: raw.length,
      });
    } catch {}
  };

  const onKey = (e) => {
    if (e.key === "Escape") onClose?.();
  };

  return (
    <>
      <div className="kpi-modal__backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${metric} at ${dateLabel}`}
        className="kpi-modal"
        onKeyDown={onKey}
      >
        <div className="kpi-modal__header">
          <div className="kpi-modal__title">
            <div className="kpi-modal__metric">{metric}</div>
            <div className="kpi-modal__date">{dateLabel}</div>
          </div>
          <button className="kpi-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="kpi-modal__value">{Number(point?.v ?? 0).toLocaleString()}</div>

        <div className="kpi-modal__comments">
          <div className="kpi-modal__comments-title">Comments</div>
          {items.length === 0 ? (
            <div className="kpi-modal__comments-empty">No comments yet.</div>
          ) : (
            <ul className="kpi-modal__comments-list">
              {items.map((c, i) => (
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
