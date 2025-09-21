import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { buildPreview } from "../../../utils/upload/preview";
import TypeIcon from "../../files/TypeIcon.jsx";
import { retry as retryFn } from "../../../utils/retry";
import { track } from "../../../utils/telemetry";
import { toast } from "../../ui/Toaster.jsx";

export default function FileItem({ file, onDownload }) {
  const id = String(file?.id ?? file?._id ?? "");
  const name = file?.name || "file";
  const mime = String(file?.mime || "application/octet-stream").toLowerCase();
  const isImage = mime.startsWith("image/");
  const href = file?.url || file?.downloadUrl || "#";

  const [state, setState] = useState({
    loading: isImage,
    url: "",
    placeholder: "",
    width: 0,
    height: 0,
    error: "",
    type: "",
  });

  const alt = useMemo(
    () => (isImage ? `${name} preview` : `${name}`),
    [isImage, name]
  );

  // Build preview for images
  useEffect(() => {
    let cancelled = false;
    if (!isImage || !href) {
      setState((s) => ({ ...s, loading: false, url: "", error: "" }));
      return () => {};
    }

    (async () => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const out = await buildPreview(href, { maxBytes: 12_000_000 });
        if (!cancelled) {
          setState({
            loading: false,
            url: out?.url || "",
            placeholder: out?.placeholder || "",
            width: out?.width || 0,
            height: out?.height || 0,
            error: out?.error || "",
            type: out?.type || "",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e?.message || "Failed to build preview",
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (state.url && state.url.startsWith("blob:")) URL.revokeObjectURL(state.url);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href, isImage, id]);

  const onRetry = async () => {
    // Toast + telemetry
    try { toast({ title: "Retrying preview…" }); } catch {}
    try { track("file_preview_retry", { fileId: id }); } catch {}

    try {
      const out = await retryFn(
        () => buildPreview(href, { maxBytes: 12_000_000 }),
        { tries: 3, backoffMs: 400 }
      );
      setState({
        loading: false,
        url: out?.url || "",
        placeholder: out?.placeholder || "",
        width: out?.width || 0,
        height: out?.height || 0,
        error: out?.error || "",
        type: out?.type || "",
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e?.message || "Preview failed" }));
      try {
        toast({ title: "Preview failed", description: String(e?.message || e), variant: "error" });
      } catch {}
    }
  };

  const onDownloadClick = (e) => {
    // Emit telemetry first; then delegate
    try { track("file_download", { fileId: id }); } catch {}
    if (onDownload) {
      e?.preventDefault?.();
      onDownload(file);
    }
  };

  // Non-image or failed preview → icon tile with actions
  if (!isImage || state.error) {
    return (
      <div className="thumb thumb--error">
        {isImage && state.error ? (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 text-[11px] rounded-md px-1.5 py-1 bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Preview failed
          </div>
        ) : null}

        <div className="grid place-items-center h-28">
          <TypeIcon mime={mime} size={28} ariaLabel={`${mime} file: ${name}`} />
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          {isImage ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 hover:bg-surface"
              title="Retry preview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          ) : <span />}

          <a
            href={href}
            download
            rel="noopener"
            onClick={onDownloadClick}
            className="text-xs inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 hover:bg-surface"
            title={`Download ${name}`}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (state.loading) {
    return <div className="thumb__skeleton" aria-label={`Loading preview for ${name}`} />;
  }

  // Successful image preview
  return (
    <figure className="thumb">
      <img
        src={state.url || state.placeholder}
        alt={alt}
        className="thumb__img"
        loading="lazy"
        width={state.width || undefined}
        height={state.height || undefined}
      />
      <figcaption className="thumb__caption">
        <a
          href={href}
          download
          rel="noopener"
          onClick={onDownloadClick}
          className="thumb__action"
          title={`Download ${name}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </a>
      </figcaption>
    </figure>
  );
}
