// src/components/admin/ProjectsTable.jsx
import React from "react";
import { ArrowUpDown } from "lucide-react";
import "../../styles/admin.css";

function SortButton({ label, active, dir, onClick }) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
        active ? "bg-surface/70 border border-border" : ""
      ].join(" ")}
      onClick={onClick}
      title={`Sort by ${label}`}
    >
      <span>{label}</span>
      <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
      {active && <span className="sr-only">{dir === "asc" ? "ascending" : "descending"}</span>}
    </button>
  );
}

/**
 * Props:
 *  - rows, loading, page, pageSize, total
 *  - sort?: { key, dir }
 *  - onPageChange(number)
 *  - onSortChange(key)
 */
export default function ProjectsTable({
  rows = [],
  loading = false,
  page = 1,
  pageSize = 25,
  total = 0,
  sort = { key: "createdAt", dir: "desc" },
  onPageChange,
  onSortChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const headerCell = (label, key) => (
    <th>
      <SortButton
        label={label}
        active={sort?.key === key}
        dir={sort?.dir}
        onClick={() => onSortChange?.(key)}
      />
    </th>
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border text-sm font-semibold">
        Projects
      </div>
      <div className="overflow-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {headerCell("Name", "title")}
              {headerCell("Owner", "owner")}
              {headerCell("Members", "membersCount")}
              {headerCell("Public?", "public")}
              {headerCell("Created", "createdAt")}
              {headerCell("Last Activity", "lastActivityAt")}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="p-3 text-sm text-muted">Loading…</td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-sm text-muted">No projects found.</td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id || p._id}>
                  <td>{p.title || p.name || "—"}</td>
                  <td>{p.ownerName || p.ownerEmail || p.ownerId || "—"}</td>
                  <td>{typeof p.membersCount === "number" ? p.membersCount : (Array.isArray(p.members) ? p.members.length : "—")}</td>
                  <td>{p.publicToken ? "Yes" : "No"}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</td>
                  <td>{p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="px-3 py-2 border-t border-border flex items-center justify-between text-sm">
        <div className="text-muted">
          Total: <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost px-2 py-1 rounded-lg border border-border"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <div className="px-2">
            Page <span className="font-medium">{page}</span> / {totalPages}
          </div>
          <button
            className="btn btn-ghost px-2 py-1 rounded-lg border border-border"
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
