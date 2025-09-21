import React, { useEffect, useRef, useState } from "react";
import { listFiles, deleteFile } from "../../api/files";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx";
import FileItem from "../project/items/FileItem.jsx"; // thumb + Retry/Download footer
import "../../styles/files.css"; // badges + pending ring + thumb utilities
import "./FileGrid.css";        // small layout helpers

/**
 * Props:
 * - projectId (required)
 * - initialFiles?: array
 * - canEdit?: boolean
 * - canManage?: boolean
 */
export default function FileGrid({
  projectId,
  initialFiles = [],
  canEdit = false,      // kept for future (uploads)
  canManage = false,    // shows delete affordance
}) {
  const [files, setFiles] = useState(() => initialFiles.map(normalizeFile));
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(!initialFiles.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Track newly-added files coming in from parent (e.g., via socket)
  const hasMountedRef = useRef(false);
  const prevIdsRef = useRef(new Set(initialFiles.map((f) => String(f.id ?? f._id ?? ""))));

  // Sync when parent pushes new files
  useEffect(() => {
    const nextIds = new Set(initialFiles.map((f) => String(f.id ?? f._id ?? "")));
    let addedCount = 0;
    for (const id of nextIds) if (!prevIdsRef.current.has(id)) addedCount++;
    prevIdsRef.current = nextIds;

    if (hasMountedRef.current && addedCount > 0) {
      try { track("file_added", { projectId, count: addedCount }); } catch {}
      try { toast({ title: `${addedCount} file${addedCount > 1 ? "s" : ""} added`, variant: "success" }); } catch {}
    }
    hasMountedRef.current = true;

    setFiles((prev) => {
      const byId = new Map();
      [...initialFiles.map(normalizeFile), ...prev].forEach((f) => byId.set(String(f.id), f));
      return Array.from(byId.values());
    });
  }, [initialFiles, projectId]);

  // Initial fetch
  useEffect(() => {
    let ignore = false;
    if (!projectId) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listFiles(projectId);
        const { items, nextCursor } = normalizeList(res);
        if (ignore) return;
        setFiles(items);
        setCursor(nextCursor);
        setHasMore(Boolean(nextCursor));
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load files");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [projectId]);

  const loadMore = async () => {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listFiles(projectId, { cursor, limit: 20 });
      const { items, nextCursor } = normalizeList(res);
      setFiles((prev) => dedupe([...prev, ...items]));
      setCursor(nextCursor);
      setHasMore(Boolean(nextCursor));
    } catch (e) {
      console.warn("files: loadMore failed", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRemove = async (id) => {
    if (!canManage) return;
    const prev = files;
    setFiles((f) => f.filter((x) => String(x.id) !== String(id)));
    try {
      await deleteFile(projectId, id);
      try { track("file_deleted", { projectId, fileId: id }); } catch {}
      try { toast({ title: "File deleted", variant: "success" }); } catch {}
    } catch (e) {
      setFiles(prev); // rollback
      const msg = e?.response?.data?.message || e?.message || "Failed to delete file.";
      try { toast({ title: "Delete failed", description: msg, variant: "error" }); } catch {}
    }
  };

  if (loading) {
    return (
      <div className="filegrid grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3">{error}</div>;
  }

  if (!files.length) {
    return <div className="text-sm text-muted">No files yet.</div>;
  }

  return (
    <>
      <div className="filegrid grid">
        {files.map((f) => {
          const status = (f.moderationStatus || f.status || "").toLowerCase();
          const isPending = status === "pending";
          const badgeClass =
            status === "blocked"
              ? "ss-badge ss-badge--blocked"
              : status === "approved" || status === "allowed"
              ? "ss-badge ss-badge--approved"
              : "ss-badge ss-badge--pending";

          return (
            <div key={f.id} className="filegrid-item relative">
              {/* Status badge + optional pending ring */}
              <span className={badgeClass}>{status || "pending"}</span>
              {isPending && <span className="ss-pulse-ring" />}

              {/* Tile (image preview or <TypeIcon/>) */}
              <FileItem
                file={f}
                onDownload={(file) => {
                  const href = file?.url || "#";
                  try { window.open(href, "_blank", "noopener,noreferrer"); } catch {}
                }}
              />

              {/* Owner-only delete (kept out of FileItem so preview stays generic) */}
              {canManage && (
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemove(f.id)}
                    className="text-xs rounded-md border border-border px-2 py-0.5 hover:bg-surface"
                    title="Delete file"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

/* ——— helpers ——— */

function normalizeFile(f) {
  const id = String(f.id ?? f._id ?? "");
  return {
    id,
    url: f.url || f.storageKey || "",
    thumbUrl: f.thumbUrl || f.thumbKey || "",
    name: f.name || "",
    size: Number(f.size || 0),
    mime: f.mime || f.type || "application/octet-stream",
    kind: f.kind || guessKind(f.mime || f.type || ""),
    status: f.status || "pending",
    moderationStatus: f.moderationStatus || f.status || "pending",
    createdAt: f.createdAt || new Date().toISOString(),
    projectId: f.projectId,
    uploaderId: f.uploaderId,
  };
}

function normalizeList(res) {
  if (Array.isArray(res)) return { items: res.map(normalizeFile), nextCursor: null };
  const items = Array.isArray(res?.items) ? res.items.map(normalizeFile) : [];
  const nextCursor = res?.nextCursor || null;
  return { items, nextCursor };
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const k = String(it.id || it._id || "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function guessKind(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "doc";
  if (mime.includes("zip") || mime.includes("gzip")) return "archive";
  return "other";
}
