// src/components/admin/DataTable.jsx
import React from "react";

/**
 * Generic, read-only, paginated + sortable table.
 *
 * Props:
 * - columns: [{ key, header, width?, align?, sortable?, render?(row) }]
 * - rows: array
 * - loading: bool
 * - page, pageSize, total
 * - sort: { key, dir: 'asc'|'desc' }
 * - onPageChange(page)
 * - onSortChange(key)
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  page = 1,
  pageSize = 25,
  total = 0,
  sort = { key: "", dir: "asc" },
  onPageChange = () => {},
  onSortChange = () => {},
  emptyText = "No results.",
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const headerCell = (col) => {
    const isSorted = sort?.key === col.key;
    const sortedIcon = isSorted ? (sort.dir === "asc" ? "▲" : "▼") : "";
    const clickable = col.sortable !== false;

    return (
      <th
        key={col.key}
        style={{ width: col.width }}
        className={clickable ? "is-sortable cursor-pointer hover:bg-white/[0.02]" : ""}
        onClick={() => clickable && onSortChange(col.key)}
        aria-sort={
          isSorted ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
        }
        role={clickable ? "button" : undefined}
      >
        <span className="hdr flex items-center gap-2">
          {col.header || col.key}
          {sortedIcon && <span className="sort text-xs opacity-60">{sortedIcon}</span>}
        </span>
      </th>
    );
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface-1 p-0 overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-2 border-b border-white/[0.08]">
            <tr>{columns.map(headerCell)}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading
              ? [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td colSpan={columns.length} className="p-4 text-sm text-text-tertiary">
                      <div className="h-4 bg-surface-2 rounded w-1/3"></div>
                    </td>
                  </tr>
                ))
              : rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-sm text-text-tertiary">
                    {emptyText}
                  </td>
                </tr>
                )
              : rows.map((row, ri) => (
                  <tr key={row.id || row._id || ri} className="hover:bg-white/[0.02] transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="p-4 text-sm text-text-secondary"
                        style={{ textAlign: col.align || "left", width: col.width }}
                      >
                        {typeof col.render === "function"
                          ? col.render(row)
                          : fallbackCell(row, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="px-4 py-3 border-t border-white/[0.08] flex items-center justify-between text-sm">
        <div className="text-text-tertiary">
          Total: <span className="font-medium text-text-secondary">{total || 0}</span>
          {rows.length > 0 && (
            <>
              {" · "}
              Showing{" "}
              <span className="font-medium text-text-secondary">
                {(page - 1) * pageSize + 1}
              </span>
              –
              <span className="font-medium text-text-secondary">
                {Math.min(page * pageSize, total || 0)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-surface-2 disabled:opacity-50 transition-all text-text-secondary"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </button>
          <div className="text-text-tertiary">
            Page <span className="font-medium text-text-secondary">{page}</span> / {totalPages}
          </div>
          <button
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-surface-2 disabled:opacity-50 transition-all text-text-secondary"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function fallbackCell(row, key) {
  const v = row?.[key];
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
