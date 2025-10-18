// src/pages/import/ImportWizard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import GradientPanel from "../../components/frame/GradientPanel.jsx";
import ProviderPicker from "../../components/import/ProviderPicker.jsx";
import LinearAuthButton from "../../components/import/LinearAuthButton.jsx";
import JiraAuthButton from "../../components/import/JiraAuthButton.jsx";
import { track } from "../../utils/telemetry";
import { UploadCloud, CheckCircle2, ArrowLeft, Table } from "lucide-react";
import "../../styles/charts.css"; // optional shared tokens
import { bumpCounter } from "../../state/metrics";

// --- tiny helpers ------------------------------------------------------------
const mockIssues = (count = 8, prefix = "ISSUE") =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    title: `Sample ${prefix} ${i + 1}`,
    assignee: i % 2 === 0 ? "You" : "Teammate",
    due: i % 3 === 0 ? new Date(Date.now() + i * 864e5).toISOString().slice(0, 10) : "",
  }));

const mapToTask = (issue) => ({
  title: issue.title,
  assigneeName: issue.assignee || "",
  dueDate: issue.due || null,
});

// -----------------------------------------------------------------------------

export default function ImportWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState(1); // 1 provider -> 2 auth -> 3 preview/import
  const [provider, setProvider] = useState(null); // 'linear' | 'jira'
  const [auth, setAuth] = useState(null); // { accessToken }
  const [issues, setIssues] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // move to next step automatically when ready
  useEffect(() => {
    if (provider && step === 1) setStep(2);
  }, [provider, step]);

  // After auth, fetch issues (stub)
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!auth || step !== 2) return;
      // fetch from provider (stub: local demo data)
      const data = provider === "linear" ? mockIssues(9, "LIN") : mockIssues(9, "JIRA");
      if (!ignore) {
        setIssues(data);
        setSelectedIds(new Set(data.map((d) => d.id))); // pre-select all
        setStep(3);
        track("import_preview_shown", { provider, count: data.length });
      }
    };
    run();
    return () => { ignore = true; };
  }, [auth, step, provider]);

  const mapped = useMemo(() => issues.map(mapToTask), [issues]);
  const selected = useMemo(
    () => issues.filter((i) => selectedIds.has(i.id)),
    [issues, selectedIds]
  );

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const importNow = async () => {
    try {
      // In MVP we don't hit backend; pretend to create tasks/projects.
      track("import_confirmed", { provider, selected: selected.length });
      alert(`Imported ${selected.length} items from ${provider}.`);
      nav("/projects"); // or wherever you want to land
    } catch (e) {
      track("import_failed", { provider, message: e?.message });
      alert(e?.message || "Import failed.");
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-4xl mx-auto space-y-6">
      <GradientPanel>
        <div className="flex items-center justify-between">
          <SectionHeader icon="UploadCloud">Import wizard</SectionHeader>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
            onClick={() => nav(-1)}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </span>
          </button>
        </div>
        <div className="text-sm text-muted mt-1">
          Step {step} of 3 · Provider → Connect → Preview &amp; Import
        </div>
      </GradientPanel>

      {/* STEP 1: provider */}
      {step === 1 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <SectionHeader icon="Boxes">Choose a provider</SectionHeader>
          <div className="mt-3">
            <ProviderPicker value={provider} onChange={setProvider} />
          </div>
        </div>
      )}

      {/* STEP 2: auth */}
      {step === 2 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <SectionHeader icon="KeySquare">Connect to {provider === "jira" ? "Jira" : "Linear"}</SectionHeader>
          <div className="mt-3 flex items-center gap-2">
            {provider === "linear" ? (
              <LinearAuthButton onAuthed={setAuth} />
            ) : (
              <JiraAuthButton onAuthed={setAuth} />
            )}
            <div className="text-sm text-muted">
              We’ll fetch your recent issues to preview before importing.
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: preview + import */}
      {step === 3 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <SectionHeader icon="Table">Preview &amp; import</SectionHeader>

          {issues.length === 0 ? (
            <div className="mt-3 text-sm text-muted">No issues found.</div>
          ) : (
            <>
              <div className="mt-2 text-sm text-muted">
                Showing <span className="font-medium">{issues.length}</span> items from{" "}
                <span className="font-medium">{provider}</span>. Uncheck anything you don’t want to import.
              </div>
              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-sm rounded-xl border border-border">
                  <thead className="bg-surface sticky top-0">
                    <tr className="text-left">
                      <th className="p-2 border-b border-border w-10">Use</th>
                      <th className="p-2 border-b border-border">Issue</th>
                      <th className="p-2 border-b border-border">Assignee</th>
                      <th className="p-2 border-b border-border">Due</th>
                      <th className="p-2 border-b border-border">Mapped task</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((it, idx) => {
                      const m = mapped[idx];
                      const on = selectedIds.has(it.id);
                      return (
                        <tr key={it.id} className="border-b border-border">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(it.id)}
                              aria-label={`Select ${it.id}`}
                            />
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{it.title}</div>
                            <div className="text-[11px] text-muted">{it.id}</div>
                          </td>
                          <td className="p-2">{it.assignee || "—"}</td>
                          <td className="p-2">{it.due || "—"}</td>
                          <td className="p-2">
                            <div className="text-xs">
                              <span className="font-medium">{m.title}</span>
                              {m.dueDate ? <span className="text-muted"> · due {m.dueDate}</span> : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-muted">
                  Selected <span className="font-medium">{selected.length}</span> of {issues.length}
                </div>
                <button
                  type="button"
                  onClick={importNow}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import {selected.length} item{selected.length === 1 ? "" : "s"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
