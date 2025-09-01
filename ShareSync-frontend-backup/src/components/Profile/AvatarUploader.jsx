// /src/components/Profile/AvatarUploader.jsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";

/**
 * AvatarUploader
 *
 * Props:
 * - onUploaded: async (File | Blob) => void   // required
 * - size: 'sm' | 'md' (default 'md')
 * - className: string
 * - buttonClassName: string (for size='sm' trigger)
 * - buttonLabel: string (default: "Change" for sm, "Upload" for md)
 * - maxSizeMB: number (default 8)
 * - autoSquare: boolean (default true) — center-crop to square before onUploaded
 * - squareSize: number (default 512) — output size when autoSquare is true
 *
 * Notes:
 * - This component performs a center square crop in-memory (canvas) to keep avatars neat.
 * - It doesn’t implement a visual crop UI yet; that can be layered in later where noted.
 */

const DEFAULT_MAX_MB = 8;

function isImage(file) {
  return file?.type?.startsWith?.("image/");
}

function bytesHuman(b = 0) {
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

async function fileToImageBitmap(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const img = new Image();
  img.decoding = "async";
  img.src = dataUrl;
  await img.decode();
  return img;
}

/** Center-crop to square and export PNG Blob */
async function autoSquareCrop(file, size = 512) {
  const img = await fileToImageBitmap(file);
  const minSide = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const sx = Math.max(0, Math.floor((img.width - minSide) / 2));
  const sy = Math.max(0, Math.floor((img.height - minSide) / 2));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
  // Give it a filename hint
  return new File([blob], "avatar.png", { type: "image/png" });
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function AvatarUploader({
  onUploaded,
  size = "md",
  className = "",
  buttonClassName = "",
  buttonLabel,
  maxSizeMB = DEFAULT_MAX_MB,
  autoSquare = true,
  squareSize = 512,
}) {
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  // Full-panel mode state
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pushError = useCallback((msg) => {
    setErrors((prev) => [...prev, String(msg)]);
    setTimeout(() => setErrors((prev) => prev.slice(1)), 3500);
  }, []);

  const validate = useCallback(
    (f) => {
      if (!f) return false;
      if (!isImage(f)) {
        pushError(`Only image files are allowed.`);
        return false;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        pushError(`Too large: ${bytesHuman(f.size)} (limit ${maxSizeMB} MB).`);
        return false;
      }
      return true;
    },
    [maxSizeMB, pushError]
  );

  const processAndUpload = useCallback(
    async (f) => {
      if (!validate(f)) return;
      setBusy(true);
      try {
        const finalFile = autoSquare ? await autoSquareCrop(f, squareSize) : f;
        await onUploaded?.(finalFile);
      } catch (e) {
        pushError(e?.message || "Failed to upload avatar.");
      } finally {
        setBusy(false);
      }
    },
    [autoSquare, onUploaded, pushError, squareSize, validate]
  );

  // ---------- Small button mode ----------
  if (size === "sm") {
    const smLabel = buttonLabel || "Change";
    return (
      <div className={classNames("inline-block", className)}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (f) processAndUpload(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={classNames(
            "px-2 py-0.5 text-[11px] rounded-full border border-transparent",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60",
            buttonClassName
          )}
          title="Change avatar"
        >
          {busy ? "Uploading…" : smLabel}
        </button>

        {!!errors.length && (
          <div className="mt-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
            {errors[0]}
          </div>
        )}
      </div>
    );
  }

  // ---------- Full panel mode ----------
  const panelLabel = buttonLabel || "Upload";

  const onFilesPicked = async (files) => {
    const f = files?.[0];
    if (!f) return;
    if (!validate(f)) return;

    // Set preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onFilesPicked(e.dataTransfer?.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  return (
    <div className={classNames(className)}>
      {/* Dropzone */}
      <div
        className={classNames(
          "rounded-2xl border-2 border-dashed p-4 text-center transition",
          dragging ? "border-indigo-400 bg-indigo-50/40" : "border-slate-300 dark:border-slate-600"
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onFilesPicked(e.currentTarget.files);
            e.currentTarget.value = "";
          }}
        />

        <div className="flex flex-col items-center gap-3">
          {/* Preview */}
          <div className="h-28 w-28 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid place-items-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-500">No image</span>
            )}
          </div>

          {/* Actions */}
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Drag & drop an image here, or{" "}
            <button
              type="button"
              className="text-indigo-600 underline"
              onClick={() => inputRef.current?.click()}
            >
              choose a file
            </button>
            .
            <div className="text-[11px] mt-1">
              Max {maxSizeMB}MB. PNG/JPEG recommended. We’ll center-crop to square for you.
            </div>
          </div>

          {/* TODO: Insert a visual crop UI here later, before calling onUploaded. */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!file || busy}
              onClick={() => processAndUpload(file)}
              className={classNames(
                "inline-flex items-center rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700",
                "disabled:opacity-50"
              )}
            >
              {busy ? "Uploading…" : panelLabel}
            </button>
            {file && (
              <button
                type="button"
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setFile(null);
                }}
                className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {!!errors.length && (
        <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
          {errors[0]}
        </div>
      )}
    </div>
  );
}
