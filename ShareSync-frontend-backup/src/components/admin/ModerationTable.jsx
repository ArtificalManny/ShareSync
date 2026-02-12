// src/components/admin/ModerationTable.jsx
import React from 'react';
import ModerationRow from './ModerationRow';

export default function ModerationTable({
  projects = [],
  loading = false,
  busyId = null,
  onApprove,
  onReject,
  onToggleSpectator,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-surface-1 border border-white/[0.06] animate-pulse"
          >
            <div className="h-4 w-1/3 bg-surface-2 rounded mb-2" />
            <div className="h-3 w-2/3 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="p-8 rounded-2xl bg-surface-1 border border-white/[0.06] text-center">
        <div className="text-sm font-medium text-text-primary">
          No projects to review
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          Try switching status (Pending / Approved / Rejected).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const id = p?.id || p?._id || p?.projectId;
        const busy = !!busyId && String(busyId) === String(id);

        return (
          <ModerationRow
            key={String(id)}
            project={p}
            busy={busy}
            onApprove={onApprove}
            onReject={onReject}
            onToggleSpectator={onToggleSpectator}
          />
        );
      })}
    </div>
  );
}
