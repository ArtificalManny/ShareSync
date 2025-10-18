// src/components/import/PreviewTable.jsx
import React from "react";

/**
 * PreviewTable
 * Props:
 *  - issues: [{ id, title, assignee, due }]
 *  - mapped: [{ title, assigneeName, dueDate }]
 *  - selectedIds: Set<string>
 *  - onToggle: (id: string) => void
 */
export default function PreviewTable({ issues = [], mapped = [], selectedIds, onToggle }) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return <div className="mt-3 text-sm text-muted">No issues found to import.</div>;
  }

  const isSelected = (id) => (selectedIds instanceof Set ? selectedIds.has(id) : true);

  return (
    <div className="mt-3 overflow-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-surface sticky top-0 z-10">
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
            const m = mapped[idx] || {};
            const on = isSelected(it.id);
            return (
              <tr key={it.id} className="border-b border-border">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggle?.(it.id)}
                    aria-label={`Select ${it.id}`}
                  />
                </td>
                <td className="p-2">
                  <div className="font-medium">{it.title || "Untitled issue"}</div>
                  <div className="text-[11px] text-muted">{it.id}</div>
                </td>
                <td className="p-2">{it.assignee || "—"}</td>
                <td className="p-2">{it.due || "—"}</td>
                <td className="p-2">
                  <div className="text-xs">
                    <span className="font-medium">{m.title || it.title || "Untitled task"}</span>
                    {m.dueDate ? <span className="text-muted"> · due {m.dueDate}</span> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
