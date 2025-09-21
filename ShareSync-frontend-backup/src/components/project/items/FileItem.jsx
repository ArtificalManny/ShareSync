// /src/components/project/items/FileItem.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { buildPreview } from "../../../utils/upload/preview";
import TypeIcon from "../../files/TypeIcon";
import { retry } from "../../../utils/retry";

export default function FileItem({ file, onDownload }) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    thumbUrl: "",
    width: 0,
    height: 0,
  });

  const mime = String(file?.mime || "application/octet-stream").toLowerCase();
  const isImage = mime.startsWith("image/");
  const name = file?.name || "File";

  const category = useMemo(() => {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime === "application/pdf") return "pdf";
    if (/zip|gzip|tar/.test(mime)) return "archive";
    if (/word|officedocument\.word/.test(mime)) return "doc";
    if (/excel|spreadsheet/.test(mime)) return "sheet";
    if (/powerpoint|presentation/.test(mime)) return "slide";
    if (/json|javascript|typescript|text\/x-/.test(mime)) return "code";
    return "other";
  }, [mime]);

  const runPreview = async () => {
    if (!isImage) {
      setState((s) => ({ ...s, loading: false, error: "", thumbUrl: "" }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const res = await retry(
        () => buildPreview(file?.thumbUrl || file?.url),
        { tries: 2, backoffMs: 300 }
      );
      setState({
        loading: false,
        error: "",
        thumbUrl: res?.url || "",
        width: res?.width || 0,
        height: res?.height || 0,
      });
    } catch (e) {
      setState({
        loading: false,
        error: e?.message || "Preview failed",
        thumbUrl: "",
        width: 0,
        height: 0,
      });
    }
  };

  useEffect(() => { runPreview(); /* eslint-disable-next-line */ }, [file?.url, file?.thumbUrl, mime]);

  return (
    <div className="rounded-xl border border-border bg-surface p-2">
      <div className="thumb relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-[rgb(241_245_249)]">
        {isImage && state.thumbUrl ? (
          <img
            src={state.thumbUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <TypeIcon category={category} className="w-8 h-8 text-muted" />
          </div>
        )}

        {!!state.error && (
          <div className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[11px] border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            Preview error
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-text" title={name}>{name}</div>
          <div className="text-[11px] text-muted truncate" title={mime}>{mime}</div>
        </div>
        <div className="flex items-center gap-1">
          {isImage && (
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
              onClick={runPreview}
              title="Retry preview"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
            onClick={() => onDownload?.(file)}
            title="Download"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
