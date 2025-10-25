import React, { useEffect, useRef } from "react";
import { X, LoaderCircle, ClipboardCopy, CheckCircle2, FileText, ListChecks } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext.jsx";
import "../../styles/assistant.css";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx"; // soft-import in try/catch where used

const SUGGESTIONS = [
  { id: "summarize", label: "Summarize project", prompt: "Summarize this project. Keep it to 4 bullet points." },
  { id: "next3", label: "Generate 3 next steps", prompt: "Generate the next 3 concrete steps with owners if known." },
  { id: "eta", label: "Estimate ETA", prompt: "Estimate ETA given current velocity. State assumptions briefly." },
  { id: "weekly", label: "Write weekly update", prompt: "Draft a weekly update for stakeholders in 5 sentences." },
];

export default function AssistantDock() {
  const { open, closeDock, draft, setDraft, result, busy, scope, projectId, run } = useAssistant();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") closeDock(); };
    window.addEventListener("keydown", onKey);
    // focus after open
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDock]);

  if (!open) return null;

  const submit = async () => {
    try { track("assistant_run", { scope, projectId }); } catch {}
    await run({}); // uses current draft from context
  };

  const setPrompt = (p) => {
    setDraft(p);
    try { track("assistant_prompt_pick", { id: p.slice(0, 16) }); } catch {}
  };

  const copyOut = async () => {
    const text = (result || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      try { toast?.({ title: "Copied", description: "Assistant output copied to clipboard." }); } catch {}
    } catch {}
  };

  const dispatchInsert = (kind) => {
    const text = (result || "").trim();
    if (!text) return;
    try {
      window.dispatchEvent(
        new CustomEvent("assistant:insert", {
          detail: { kind, text, scope, projectId },
        })
      );
      try { toast?.({ title: "Inserted", description: `Sent ${kind} to the active surface.` }); } catch {}
      try { track("assistant_insert", { kind, scope, projectId }); } catch {}
    } catch {}
  };

  return (
    <>
      <div className="assistant-backdrop" onClick={closeDock} />
      <div className="assistant-dock" role="dialog" aria-modal="true" aria-label="AI Assistant">
        <div className="assistant-dock__head">
          <div className="assistant-title">
            <span className="assistant-dot" /> Predictive Mentor
          </div>
          <button className="assistant-iconbtn" aria-label="Close" onClick={closeDock}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="assistant-dock__row">
          <div className="assistant-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s.id} type="button" className="assistant-suggestion" onClick={() => setPrompt(s.prompt)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="assistant-dock__row">
          <label className="assistant-label">Ask anything</label>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="assistant-input"
            placeholder="e.g., Summarize this project and give me 3 next steps…"
            rows={3}
          />
          <div className="assistant-actions">
            <button
              type="button"
              className="assistant-run"
              disabled={busy || !draft.trim()}
              onClick={submit}
            >
              {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {busy ? "Thinking…" : "Run"}
            </button>
          </div>
        </div>

        <div className="assistant-dock__row">
          <label className="assistant-label">Draft</label>
          <div className="assistant-output" data-empty={!result}>
            {result ? (
              <pre className="assistant-pre">{result}</pre>
            ) : (
              <div className="assistant-output__empty">Results will appear here.</div>
            )}
          </div>
          <div className="assistant-output-actions">
            <button type="button" className="assistant-ghost" onClick={copyOut}>
              <ClipboardCopy className="w-4 h-4" />
              Copy
            </button>
            <button type="button" className="assistant-ghost" onClick={() => dispatchInsert("comment")}>
              <FileText className="w-4 h-4" />
              Insert as comment
            </button>
            <button type="button" className="assistant-ghost" onClick={() => dispatchInsert("tasks")}>
              <ListChecks className="w-4 h-4" />
              Insert as tasks
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
