// src/pages/admin/AdminModerationProjects.jsx
// Admin panel route: /admin/moderation/projects
//
// Backend endpoints expected:
// - GET   /api/moderation/projects?status=pending
// - PATCH /api/moderation/projects/:id  { moderationStatus, reason, spectatorMode }
//
// Safe: if backend isn't wired yet, shows toast error and stays stable.

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldAlert, Search } from "lucide-react";
import { toast } from "../../components/ui/toast";

// ✅ Use API wrapper (consistent unwrapping + better errors)
import { getModerationProjects, patchModerationProject } from "../../api/moderation";

// ✅ Optional UI split (recommended)
import ModerationTable from "../../components/admin/ModerationTable";

const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function safeName(p) {
  return p?.name || p?.title || "Untitled Project";
}

function safeId(p) {
  return p?.id || p?._id || p?.projectId;
}

export default function AdminModerationProjects() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [q, setQ] = useState("");
  const [reasonDraft, setReasonDraft] = useState({}); // per-project

  const filtered = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((p) => {
      const name = safeName(p).toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const id = String(safeId(p) || "").toLowerCase();
      return name.includes(query) || desc.includes(query) || id.includes(query);
    });
  }, [rows, q]);

  async function load() {
    setLoading(true);
    try {
      const data = await getModerationProjects({ status });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.normalizedMessage || err?.message || "Failed to load moderation queue";
      toast({ title: "Moderation load failed", description: msg, variant: "error" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function patchOne(projectId, patch) {
    if (!projectId) return;

    setBusyId(projectId);
    try {
      const updated = await patchModerationProject(projectId, patch);

      toast({ title: "Saved", description: "Moderation decision stored.", variant: "success" });

      // Update row then filter out if tab no longer matches
      setRows((prev) => {
        const next = prev.map((p) => (String(safeId(p)) === String(projectId) ? { ...p, ...updated } : p));
        return next.filter((p) => String(p?.moderationStatus || "").toLowerCase() === status);
      });
    } catch (err) {
      const msg = err?.normalizedMessage || err?.message || "Failed to update project";
      toast({ title: "Update failed", description: msg, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  // Handlers (wired for ModerationRow signature too)
  const handleApprove = (projectId, project) => {
    const id = projectId || safeId(project);
    if (!id) return;
    patchOne(id, { moderationStatus: "approved" });
  };

  const handleReject = (projectId, project, explicitReason) => {
    const id = projectId || safeId(project);
    if (!id) return;

    const reason =
      String(explicitReason || reasonDraft[id] || "").trim() || "Rejected by admin.";

    patchOne(id, { moderationStatus: "rejected", reason });
  };

  const handleToggleSpectator = (projectId, project, nextMode) => {
    const id = projectId || safeId(project);
    if (!id) return;

    const current = String(project?.spectatorMode || "view").toLowerCase();
    const next =
      nextMode ||
      (current === "suggest" ? "view" : "suggest");

    patchOne(id, { spectatorMode: next });
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Project Moderation</h1>
            <p className="text-sm text-text-tertiary">
              Approve listings, reject with a reason, and control spectator suggestion mode.
            </p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08] hover:bg-surface-2 transition-colors text-sm text-text-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={[
                "px-3 py-1.5 rounded-lg text-sm border transition-all",
                status === t.key
                  ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                  : "bg-surface-1 text-text-tertiary border-white/[0.08] hover:bg-surface-2",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, description, or ID…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-1 border border-white/[0.08] text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* ✅ Use ModerationTable + ModerationRow */}
      <ModerationTable
        projects={filtered}
        loading={loading}
        busyId={busyId}
        onApprove={handleApprove}
        onReject={handleReject}
        onToggleSpectator={handleToggleSpectator}
      />

      {/* Optional: keep your per-row reject reason drafts (used if you want manual reject button elsewhere later) */}
      {/* We keep the state because you already had it; Row has its own reason input too. */}
      {/* If you want Row to use these drafts instead, tell me and I’ll wire it. */}
      <div className="mt-5 text-xs text-text-tertiary">
        If your backend moderation module/routes aren’t mounted yet, you’ll get a toast error here. That’s expected until Phase 2 backend wiring is complete.
      </div>
    </div>
  );
}
