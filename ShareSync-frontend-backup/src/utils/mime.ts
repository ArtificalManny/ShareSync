/* Minimal MIME helpers: ext<->mime map, classifier, and sniffing */

const EXT_TO_MIME: Record<string, string> = {
  // images
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", avif: "image/avif", bmp: "image/bmp", svg: "image/svg+xml",
  heic: "image/heic", heif: "image/heif",

  // video
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska",

  // audio
  mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", ogg: "audio/ogg", flac: "audio/flac",

  // docs
  pdf: "application/pdf",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain", md: "text/markdown", csv: "text/csv",

  // code-ish
  json: "application/json", js: "text/javascript", ts: "text/typescript",
  jsx: "text/plain", tsx: "text/plain", css: "text/css", html: "text/html",

  // archives
  zip: "application/zip", rar: "application/vnd.rar", "7z": "application/x-7z-compressed", tar: "application/x-tar", gz: "application/gzip",
};

const MIME_TO_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_TO_MIME).map(([ext, mime]) => [mime, ext])
);

export function extname(name = ""): string {
  const m = /\.[^.]+$/.exec(name.toLowerCase());
  return m ? m[0].slice(1) : "";
}

export function mimeFromExt(ext: string): string | undefined {
  return EXT_TO_MIME[ext.toLowerCase()];
}

export function extFromMime(mime: string): string | undefined {
  return MIME_TO_EXT[mime.toLowerCase()];
}

export function sniffMime(blobOrAny: { type?: string } | Blob, filename?: string): string {
  const t = (blobOrAny && (blobOrAny as any).type) || "";
  if (t) return t;
  const ext = filename ? extname(filename) : "";
  return (ext && mimeFromExt(ext)) || "application/octet-stream";
}

export type MimeCategory =
  | "image" | "video" | "audio"
  | "pdf" | "doc" | "sheet" | "presentation" | "text"
  | "code" | "archive" | "other";

export function classifyMime(mime = ""): MimeCategory {
  const m = mime.toLowerCase();

  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";

  if (m === "application/pdf") return "pdf";
  if (m.includes("word")) return "doc";
  if (m.includes("sheet") || m.includes("excel") || m.includes("csv")) return "sheet";
  if (m.includes("presentation") || m.includes("powerpoint")) return "presentation";
  if (m.startsWith("text/")) {
    if (m.includes("markdown") || m.includes("html") || m.includes("css")) return "code"; // treat as code-like
    return "text";
  }
  if (m.includes("json") || m.includes("javascript") || m.includes("typescript")) return "code";
  if (m.includes("zip") || m.includes("rar") || m.includes("7z") || m.includes("tar") || m.includes("gzip")) return "archive";

  return "other";
}

/** Simple icon key helper for consumers (e.g., TypeIcon) */
export function iconForMime(mime = ""): string {
  const cat = classifyMime(mime);
  switch (cat) {
    case "image": return "image";
    case "video": return "video";
    case "audio": return "audio";
    case "pdf": return "pdf";
    case "doc": return "doc";
    case "sheet": return "sheet";
    case "presentation": return "slides";
    case "text": return "text";
    case "code": return "code";
    case "archive": return "archive";
    default: return "file";
  }
}
