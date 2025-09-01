// /src/components/compose/UpdateComposer.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Paperclip,
  UploadCloud,
  X,
  AlertTriangle,
  File as FileIcon,
} from "lucide-react";
import { uploadFiles as apiUploadFiles } from "../../api/uploads";

/**
 * UpdateComposer
 *
 * Props:
 * - onSubmit: async ({ text, attachments }) => void
 *     attachments[]: { id? (server), tempId?, kind:'image'|'file', name, size, mime, url, previewUrl? }
 * - onUploadFiles?: async (File[]) => Promise<AttachmentLike[]>
 *     Optional uploader; if absent we use the real API uploader (api/uploads.js).
 * - acceptImages?: boolean (default true)
 * - acceptFiles?: boolean (default true)
 * - maxSizeMB?: number (default 20)
 * - disallowedExt?: string[] (default ['exe','dmg','js','bat','cmd','sh'])
 * - placeholder?: string
 * - disabled?: boolean
 *
 * Notes:
 * - Paste images directly into textarea to attach.
 * - Drag-and-drop anywhere on composer.
 * - Client-side moderation tips + basic preflight validation.
 */

const DEFAULT_MAX_MB = 20;
const DEFAULT_BAD_EXT = ["exe", "dmg", "js", "bat", "cmd", "sh"];

function bytesToHuman(b = 0) {
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function extOf(name = "") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function isImage(fileOrMime) {
  const type = typeof fileOrMime === "string" ? fileOrMime : fileOrMime?.type || "";
  return type.startsWith("image/");
}

function validateFile(file, { maxSizeMB = DEFAULT_MAX_MB, disallowedExt = DEFAULT_BAD_EXT } = {}) {
  const problems = [];
  if (!file) {
    problems.push("File missing.");
    return problems;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    problems.push(`Too large: ${bytesToHuman(file.size)} (limit ${maxSizeMB} MB).`);
  }
  const e = extOf(file.name);
  if (disallowedExt.includes(e)) {
    problems.push(`Blocked file type ".${e}".`);
  }
  // Basic MIME sanity
  if (!file.type) {
    problems.push("Unknown file type.");
  }
  return problems;
}

let tempCounter = 1;
function makeTempAttachment(file) {
  const tempId = `temp-${Date.now()}-${tempCounter++}`;
  const objUrl = URL.createObjectURL(file);
  return {
    tempId,
    kind: isImage(file) ? "image" : "file",
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    url: objUrl, // for download/open
    previewUrl: isImage(file) ? objUrl : null, // show image
    _revokeOnUnmount: objUrl,
  };
}

export default function UpdateComposer({
  onSubmit,
  onUploadFiles, // optional; if not provided, we use apiUploadFiles
  acceptImages = true,
  acceptFiles = true,
  maxSizeMB = DEFAULT_MAX_MB,
  disallowedExt = DEFAULT_BAD_EXT,
  placeholder = "What’s the latest? You can paste images or drop files…",
  disabled = false,
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const areaRef = useRef(null);

  // revoke any object URLs we created
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a._revokeOnUnmount) URL.revokeObjectURL(a._revokeOnUnmount);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPost = useMemo(() => {
    const hasText = text.trim().length > 0;
    const hasFiles = attachments.length > 0;
    return !disabled && !busy && (hasText || hasFiles);
  }, [text, attachments, busy, disabled]);

  const pushError = useCallback((msg) => {
    setErrors((prev) => [...prev, String(msg)]);
    // auto-clear after a bit
    setTimeout(() => setErrors((prev) => prev.slice(1)), 4000);
  }, []);

  // Default uploader → uses /src/api/uploads.js
  const defaultUpload = useCallback(async (filesArr) => {
    const { ok, items, rejected, error } = await apiUploadFiles(filesArr);
    // surface any client-side rejections first
    (rejected || []).forEach((r) => pushError(`${r.file?.name || "file"}: ${r.reason}`));
    if (!ok && error) pushError(error);

    // Normalize to composer attachment shape
    const normalized =
      (items || []).map((it) => ({
        id: it.id,
        tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: isImage(it.mime) ? "image" : "file",
        name: it.name,
        size: it.size ?? 0,
        mime: it.mime || "application/octet-stream",
        url: it.url,
        previewUrl: it.thumbUrl || (isImage(it.mime) ? it.url : null),
      })) || [];

    return normalized;
  }, [pushError]);

  const effectiveUploader = onUploadFiles || defaultUpload;

  const handleFiles = useCallback(
    async (filesList) => {
      if (!filesList?.length) return;
      const incoming = Array.from(filesList);

      // Validation pass
      const allowed = [];
      for (const f of incoming) {
        const problems = validateFile(f, { maxSizeMB, disallowedExt });
        if (problems.length) {
          problems.forEach((p) => pushError(`${f.name}: ${p}`));
          continue;
        }
        if (!acceptImages && isImage(f)) {
          pushError(`${f.name}: images currently disabled.`);
          continue;
        }
        if (!acceptFiles && !isImage(f)) {
          pushError(`${f.name}: files currently disabled.`);
          continue;
        }
        allowed.push(f);
      }
      if (!allowed.length) return;

      try {
        // Prefer real API upload; fall back to local object URLs if needed
        const uploaded = await effectiveUploader(allowed);
        if (uploaded && uploaded.length) {
          setAttachments((prev) => [...prev, ...uploaded]);
        } else {
          // absolute fallback (should be rare)
          const temps = allowed.map(makeTempAttachment);
          setAttachments((prev) => [...prev, ...temps]);
        }
      } catch (e) {
        pushError(e?.message || "Failed to attach files.");
      }
    },
    [acceptFiles, acceptImages, disallowedExt, effectiveUploader, maxSizeMB, pushError]
  );

  // Paste images into the textarea
  const onPaste = useCallback(
    (e) => {
      const files = e.clipboardData?.files;
      if (files && files.length) {
        const imgs = Array.from(files).filter((f) => isImage(f));
        if (imgs.length) {
          e.preventDefault();
          handleFiles(imgs);
        }
      }
    },
    [handleFiles]
  );

  // Drag & drop
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files?.length) handleFiles(files);
    },
    [handleFiles]
  );

  // Click-to-pick
  const fileInputRef = useRef(null);
  const triggerFilePick = () => fileInputRef.current?.click();

  const removeAttachment = useCallback((tempIdOrId) => {
    setAttachments((prev) => {
      const toRemove = prev.find((a) => a.tempId === tempIdOrId || a.id === tempIdOrId);
      if (toRemove?._revokeOnUnmount) {
        URL.revokeObjectURL(toRemove._revokeOnUnmount);
      }
      return prev.filter((a) => a !== toRemove);
    });
  }, []);

  const submit = useCallback(async () => {
    if (!canPost) return;
    setBusy(true);
    try {
      await onSubmit?.({
        text: text.trim(),
        attachments,
      });
      setText("");
      // Do not revoke uploaded attachments that may be used by feed; parent will reconcile.
      setAttachments([]);
    } catch (e) {
      pushError(e?.message || "Failed to post update.");
    } finally {
      setBusy(false);
    }
  }, [attachments, canPost, onSubmit, pushError, text]);

  // Keyboard: Cmd/Ctrl+Enter to submit
  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  // Allowed accept string for <input type="file">
  const acceptStr = useMemo(() => {
    if (acceptImages && !acceptFiles) return "image/*";
    if (!acceptImages && acceptFiles) return "*/*";
    return "*/*"; // allow all; validation will gate
  }, [acceptFiles, acceptImages]);

  return (
    <div
      className={`rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 p-3 transition-colors ${
        isDragging ? "ring-2 ring-indigo-500/60" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Textarea */}
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            ref={areaRef}
            rows={3}
            className="w-full rounded-lg border border-slate-300/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            disabled={disabled}
            aria-label="Write an update"
          />
          {/* Safety tip */}
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Keep it professional. No explicit, illegal, or threatening content.
          </div>
        </div>

        {/* Actions (attach) */}
        <div className="shrink-0 flex flex-col gap-2 items-end">
          <button
            type="button"
            onClick={triggerFilePick}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/70 dark:border-slate-700 px-2 py-1 text-xs hover:bg-white/70 dark:hover:bg-slate-800"
            title="Attach files or images"
          >
            <Paperclip className="w-4 h-4" />
            Attach
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptStr}
            onChange={(e) => {
              const files = e.currentTarget.files;
              if (files?.length) handleFiles(files);
              // reset so selecting same file again works
              e.currentTarget.value = "";
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Attachments */}
      {!!attachments.length && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((a) => (
            <AttachmentChip key={a.tempId || a.id} a={a} onRemove={removeAttachment} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-slate-500">
          <UploadCloud className="inline w-3.5 h-3.5 mr-1" />
          Drag & drop files here, or paste images.
        </div>
        <button
          onClick={submit}
          disabled={!canPost}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          Post
        </button>
      </div>

      {/* Error toasts (inline simple) */}
      {!!errors.length && (
        <div className="mt-2 space-y-1">
          {errors.map((e, i) => (
            <div
              key={`${e}-${i}`}
              className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1"
              role="alert"
            >
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentChip({ a, onRemove }) {
  if (a.kind === "image" && a.previewUrl) {
    return (
      <div className="relative group rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700">
        <img
          src={a.previewUrl}
          alt={a.name}
          className="h-24 w-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/45 text-white text-[11px] px-2 py-1 truncate">
          {a.name} • {bytesToHuman(a.size)}
        </div>
        <button
          type="button"
          onClick={() => onRemove(a.tempId || a.id)}
          className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition"
          aria-label={`Remove ${a.name}`}
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group rounded-lg border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <FileIcon className="w-4 h-4 text-slate-500" />
        <div className="min-w-0">
          <div className="truncate">{a.name}</div>
          <div className="text-[11px] text-slate-500">{bytesToHuman(a.size)}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(a.tempId || a.id)}
        className="absolute top-1.5 right-1.5 rounded-full p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition"
        aria-label={`Remove ${a.name}`}
        title="Remove"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}