/* Preview pipeline (no-op safe)
 * - Sniffs MIME (via Blob.type or filename)
 * - Only processes images; everything else returns { error } so UI can fall back to <TypeIcon/>
 * - Tries createImageBitmap -> canvas re-encode (EXIF-neutral)
 * - Generates a tiny placeholder data-URL
 * - Returns an object URL for the processed blob and a revoke() helper
 */

import { classifyMime, sniffMime } from "../mime";

export type PreviewResult = {
  url: string;                 // object URL for the preview blob
  width: number;
  height: number;
  type: string;                // resolved MIME
  placeholder?: string | null; // tiny data-url
  error?: string | null;
  revoke?: () => void;         // call when you’re done with the URL
};

type BuildOpts = {
  maxEdge?: number;            // max dimension in px (default 512)
  maxBytes?: number;           // skip processing if > maxBytes (default 50MB)
  quality?: number;            // 0..1 (default 0.9)
  preferServerThumb?: string | null; // if provided, we’ll return this directly
  filename?: string;           // used for sniffing MIME when Blob.type is empty
  retries?: number;            // retry bitmap decode (default 1)
};

const DEFAULTS: Required<Pick<BuildOpts, "maxEdge" | "maxBytes" | "quality" | "retries">> = {
  maxEdge: 512,
  maxBytes: 50 * 1024 * 1024,
  quality: 0.9,
  retries: 1,
};

function pickOutputType(): "image/webp" | "image/png" {
  // Most modern browsers support webp; if not, PNG is universally supported.
  const canWebp = typeof document !== "undefined" && !!document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  return canWebp ? "image/webp" : "image/png";
}

async function blobFromUrl(url: string): Promise<Blob> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}

async function loadBitmap(blob: Blob, retries = 1): Promise<ImageBitmap> {
  let err: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      // Ask browser to respect EXIF if supported
      // @ts-ignore – imageOrientation not in older TS libdom
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch (e) {
      err = e;
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  throw err;
}

async function loadHtmlImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    // In modern browsers this applies EXIF orientation automatically for JPEGs.
    // Some older engines won’t; the canvas draw still strips metadata.
    img.decoding = "async";
    img.src = url;
  });
}

function drawScaled(
  src: CanvasImageSource,
  sw: number,
  sh: number,
  maxEdge: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  // High quality downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src as any, 0, 0, sw, sh, 0, 0, width, height);
  return { canvas, width, height };
}

export async function buildPreview(
  input: Blob | File | string,
  opts: BuildOpts = {}
): Promise<PreviewResult> {
  const { maxEdge, maxBytes, quality, preferServerThumb, filename, retries } = { ...DEFAULTS, ...opts };

  try {
    // If the server gave a thumb URL, prefer it and short-circuit.
    if (preferServerThumb && typeof preferServerThumb === "string") {
      return {
        url: preferServerThumb,
        width: 0,
        height: 0,
        type: "image/auto",
        placeholder: null,
        error: null,
        revoke: undefined,
      };
    }

    // Normalize to Blob
    const sourceBlob: Blob = typeof input === "string" ? await blobFromUrl(input) : input;

    // MIME sniff
    const resolvedType = sniffMime(sourceBlob, filename);
    const category = classifyMime(resolvedType);

    if (category !== "image") {
      // Not an image → no preview processing. Let UI show a TypeIcon.
      return {
        url: "",
        width: 0,
        height: 0,
        type: resolvedType,
        placeholder: null,
        error: "non-image",
      };
    }

    if (sourceBlob.size > maxBytes) {
      return {
        url: "",
        width: 0,
        height: 0,
        type: resolvedType,
        placeholder: null,
        error: "too-large",
      };
    }

    // Decode
    let width = 0, height = 0;
    let drawSrc: CanvasImageSource | null = null;

    if (typeof createImageBitmap === "function") {
      const bmp = await loadBitmap(sourceBlob, retries);
      width = bmp.width;
      height = bmp.height;
      drawSrc = bmp;
    } else {
      const img = await loadHtmlImageFromBlob(sourceBlob);
      width = img.naturalWidth || img.width;
      height = img.naturalHeight || img.height;
      drawSrc = img;
    }

    // Draw to canvas (strips EXIF) with scaling
    const { canvas, width: outW, height: outH } = drawScaled(drawSrc!, width, height, maxEdge);

    // Placeholder (tiny)
    let placeholder: string | null = null;
    try {
      const ph = drawScaled(drawSrc!, width, height, 20);
      placeholder = ph.canvas.toDataURL("image/webp", 0.3);
    } catch {
      placeholder = null;
    }

    // Re-encode to neutral image format
    const outType = pickOutputType();
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), outType, quality));
    const url = URL.createObjectURL(blob);
    const revoke = () => URL.revokeObjectURL(url);

    // Cleanup bitmap if used
    try {
      // @ts-ignore
      if (drawSrc && typeof drawSrc.close === "function") drawSrc.close();
    } catch {}

    return { url, width: outW, height: outH, type: outType, placeholder, error: null, revoke };
  } catch (e: any) {
    return {
      url: "",
      width: 0,
      height: 0,
      type: "unknown",
      placeholder: null,
      error: e?.message || "preview-failed",
    };
  }
}
