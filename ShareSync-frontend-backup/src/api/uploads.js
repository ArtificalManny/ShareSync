// /src/api/uploads.js
//
// Frontend helper for file & image uploads.
// Talks to your backend route (default: POST /api/uploads/file) using multipart/form-data.
// Adds basic client-side safety checks before sending.
//
// Usage:
//   import { uploadFiles } from "../api/uploads";
//   const { ok, items, error } = await uploadFiles(fileListOrArray);

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  ""; // fallback to same-origin

// Keep client checks in sync with server policy (see Trust & Safety brief)
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Common dangerous extensions we’ll block client-side
export const DANGEROUS_EXTENSIONS = new Set([
  "exe","msi","bat","cmd","sh","bash","zsh","ps1","js","mjs","cjs",
  "jar","apk","dmg","pkg","iso","dll","sys","scr","reg","vb","vbs"
]);

// Light MIME allow-list buckets (you can relax/tighten later)
const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "text/", "application/pdf"];
const ALLOWED_APPLICATION_SUFFIXES = [
  "json","csv","xml",
  "vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "msword", // doc
  "vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "vnd.ms-excel", // xls
  "vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "vnd.ms-powerpoint", // ppt
  "zip","x-zip-compressed","x-7z-compressed","x-rar-compressed","x-tar"
];

function extOf(name = "") {
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : "";
}

export function isAllowedFile(file) {
  if (!file) return { ok: false, reason: "empty" };

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: `File too large (> ${MAX_FILE_SIZE_MB}MB)` };
  }

  const ext = extOf(file.name);
  if (ext && DANGEROUS_EXTENSIONS.has(ext)) {
    return { ok: false, reason: `.${ext} files are not allowed` };
  }

  const type = file.type || "";
  const top = type.split("/")[0];

  if (ALLOWED_MIME_PREFIXES.some((pre) => type.startsWith(pre))) {
    return { ok: true };
  }
  if (type.startsWith("application/")) {
    const suf = type.slice("application/".length);
    if (ALLOWED_APPLICATION_SUFFIXES.includes(suf)) return { ok: true };
  }

  // If the browser didn’t set a type but the ext is benign (txt, md, csv, pdf), allow it
  if (!type) {
    if (["txt", "md", "csv", "pdf"].includes(ext)) return { ok: true };
  }

  return { ok: false, reason: `Unsupported file type (${type || "." + ext || "unknown"})` };
}

function mapServerFile(raw) {
  // Normalize server response into a consistent client shape
  if (!raw || typeof raw !== "object") return null;
  return {
    id: raw.id || raw._id || raw.fileId || raw.key || raw.url, // best-effort
    url: raw.url,
    thumbUrl: raw.thumbUrl || raw.thumbnailUrl || null,
    name: raw.name || raw.filename || raw.key || "file",
    size: raw.size ?? null,
    mime: raw.mime || raw.mimetype || raw.contentType || "",
    ownerId: raw.ownerId || raw.userId || null,
    createdAt: raw.createdAt || null,
  };
}

/**
 * Upload a single File (multipart).
 * @param {File} file
 * @param {Object} opts
 * @param {string} [opts.endpoint="/api/uploads/file"]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ok:boolean, item?:any, error?:string}>}
 */
export async function uploadFile(file, opts = {}) {
  const endpoint = opts.endpoint || "/api/uploads/file";

  const check = isAllowedFile(file);
  if (!check.ok) return { ok: false, error: check.reason };

  const fd = new FormData();
  fd.append("file", file, file.name);

  // Include any additional form fields your backend expects:
  // fd.append("scope", "project"); ...

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      body: fd,
      credentials: "include", // send cookies / auth if using cookie session
      signal: opts.signal,
      // headers: DO NOT set Content-Type for FormData; the browser will set it
    });

    if (!res.ok) {
      let reason = `Upload failed (${res.status})`;
      try {
        const j = await res.json();
        reason = j?.message || j?.error || reason;
      } catch {}
      return { ok: false, error: reason };
    }

    const data = await res.json();
    // Support either {file: {...}} or direct {...}
    const fileObj = mapServerFile(data?.file || data);
    if (!fileObj) return { ok: false, error: "Malformed upload response" };

    return { ok: true, item: fileObj };
  } catch (e) {
    return { ok: false, error: e?.message || "Network error during upload" };
  }
}

/**
 * Upload multiple files in parallel (with basic client safety).
 * @param {File[]|FileList} files
 * @param {Object} opts
 * @param {string} [opts.endpoint="/api/uploads/file"]
 * @returns {Promise<{ok:boolean, items?:any[], rejected?:{file:File, reason:string}[], error?:string}>}
 */
export async function uploadFiles(files, opts = {}) {
  const arr = Array.from(files || []);
  if (!arr.length) return { ok: true, items: [] };

  const accepted = [];
  const rejected = [];

  for (const f of arr) {
    const ck = isAllowedFile(f);
    if (ck.ok) accepted.push(f);
    else rejected.push({ file: f, reason: ck.reason });
  }

  const results = await Promise.all(accepted.map((f) => uploadFile(f, opts)));
  const items = [];
  const failures = [];

  results.forEach((r, i) => {
    if (r.ok) items.push(r.item);
    else failures.push({ file: accepted[i], reason: r.error || "Upload failed" });
  });

  return {
    ok: failures.length === 0,
    items,
    rejected: [...rejected, ...failures],
    error: failures.length ? `${failures.length} upload(s) failed` : undefined,
  };
}
