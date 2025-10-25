import React, { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createTask } from "../../api/tasks";
import { toast } from "../ui/Toaster.jsx";
import { track } from "../../utils/telemetry";
import useHotkey from "../../hooks/useHotKey.js";
import "../../styles/assistant.css"; // reuse glass styles
import "./QuickCapture.local.css"; // optional if you want to add overrides

// Tiny global capture dialog opened with ⌘J.
// Usage: mount once near the app root <QuickCapture defaultProjectId={...} />
export default function QuickCapture({ defaultProjectId = null }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Toggle with Cmd/Ctrl+J
  useHotkey("cmd+j", (e) => {
    e.preventDefault();
    setOpen((v) => !v);
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const onClose = () => {
    if (busy) return;
    setOpen(false);
    setText("");
  };

  const parse = (raw) => {
    // mini syntax: "#proj:ID @due:YYYY-MM-DD ^p1 rest of title"
    const mProj = raw.match(/#proj:([A-Za-z0-9_-]+)/i);
    const mDue = raw.match(/@due:([0-9]{4}-[0-9]{2}-[0-9]{2}|today|tomorrow)/i);
    const mPriority = raw.match(/\^p([1-3])/i);

    let title = raw
      .replace(/#proj:[^\s]+/i, "")
      .replace(/@due:[^\s]+/i, "")
      .replace(/\^p[1-3]/i, "")
      .trim();

    const proj = mProj ? mProj[1] : defaultProjectId;
    let dueDate = null;
    if (mDue) {
      const v = mDue[1].toLowerCase();
      if (v === "today") dueDate = new Date();
      else if (v === "tomorrow") { const d = new Date(); d.setDate(d.getDate() + 1); dueDate = d; }
      else dueDate = new Date(v);
    }
    const priority = mPriority ? Number(mPriority[1]) : undefined;
    return { title, projectId: proj || null, dueDate, priority };
  };

  const submit = async () => {
    if (!text.trim()) return;
    const { title, projectId, dueDate, priority } = parse(text);
    setBusy(true);
    try {
      const created = await createTask(projectId, { title, dueDate, priority });
      try {
        toast({ title: "Captured", description: title });
        track("quick_capture_created", { projectId, hasDue: !!dueDate, priority });
      } catch {}
      setText("");
      setOpen(false);
      // Broadcast optimistically (others can listen to update lists)
      window.dispatchEvent(new CustomEvent("quick-capture:created", { detail: { task: created } }));
    } catch (e) {
      toast?.({ title: "Couldn’t create task", description: e?.message || "Try again.", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="assistant-backdrop" onClick={onClose} />
      <div className="qc-dock" role="dialog" aria-modal="true" aria-label="Quick capture">
        <div className="qc-head">
          <div className="qc-title"><Plus className="w-4 h-4" /> Quick Add</div>
          <button className="assistant-iconbtn" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="qc-body">
          <input
            ref={inputRef}
            className="qc-input"
            placeholder="What’s the task?  (#proj:ID @due:YYYY-MM-DD ^p1)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
          />
          <div className="qc-actions">
            <button className="today-primary" disabled={busy || !text.trim()} onClick={submit}>
              Add task
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
