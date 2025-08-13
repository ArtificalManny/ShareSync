// /src/components/project/AuditLog.jsx
import React, { useState } from "react";

export default function AuditLog({ projectId }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold">Audit Log</span>
        <span className="text-xs text-slate-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-500">
          (Admin-only) Role changes, invites, privacy flips will appear here. Project: {projectId}
        </div>
      )}
    </section>
  );
}
