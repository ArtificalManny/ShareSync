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
        className={clickable ? "is-sortable" : undefined}
        onClick={() => clickable && onSortChange(col.key)}
        aria-sort={
          isSorted ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
        }
        role={clickable ? "button" : undefined}
      >
        <span className="hdr">
          {col.header || col.key}
          {sortedIcon && <span className="sort">{sortedIcon}</span>}
        </span>
      </th>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-0 overflow-hidden">
      <div className="overflow-auto">
        <table className="admin-table">
          <thead>
            <tr>{columns.map(headerCell)}</tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td colSpan={columns.length} className="p-3 text-sm text-muted">
                      Loading…
                    </td>
                  </tr>
                ))
              : rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="p-3 text-sm text-muted">
                    {emptyText}
                  </td>
                </tr>
                )
              : rows.map((row, ri) => (
                  <tr key={row.id || row._id || ri}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
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
      <div className="px-3 py-2 border-t border-border flex items-center justify-between text-sm">
        <div className="text-muted">
          Total: <span className="font-medium">{total || 0}</span>
          {rows.length > 0 && (
            <>
              {" · "}
              Showing{" "}
              <span className="font-medium">
                {(page - 1) * pageSize + 1}
              </span>
              –
              <span className="font-medium">
                {Math.min(page * pageSize, total || 0)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost px-2 py-1 rounded-lg border border-border"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </button>
          <div className="px-2">
            Page <span className="font-medium">{page}</span> / {totalPages}
          </div>
          <button
            className="btn btn-ghost px-2 py-1 rounded-lg border border-border"
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
