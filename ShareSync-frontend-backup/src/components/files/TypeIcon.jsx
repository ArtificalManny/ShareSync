import React from "react";
import {
  File,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Code,
  FileSpreadsheet,
} from "lucide-react";
import { iconForMime } from "../../utils/mime";

export default function TypeIcon({
  mime = "",
  filename = "",
  size = 20,
  className = "",
  tone = "default",
}) {
  const key = iconForMime(mime || guessFromName(filename));
  const IconCmp = pickIcon(key);

  const toneCls =
    tone === "blue" ? "text-sky-600" :
    tone === "emerald" ? "text-emerald-600" :
    tone === "rose" ? "text-rose-600" :
    tone === "amber" ? "text-amber-600" :
    "text-slate-500 dark:text-slate-300";

  return (
    <IconCmp
      width={size}
      height={size}
      className={`${toneCls} ${className}`}
      aria-hidden="true"
    />
  );
}

function pickIcon(key) {
  if (key === "image") return ImageIcon;
  if (key === "video") return Video;
  if (key === "audio") return Music;
  if (key === "pdf") return FileText;
  if (key === "doc") return FileText;
  if (key === "sheet") return (FileSpreadsheet ? FileSpreadsheet : FileText);
  if (key === "slides") return FileText;
  if (key === "text") return FileText;
  if (key === "code") return Code;
  if (key === "archive") return Archive;
  return File;
}

function guessFromName(name = "") {
  const ext = name.toLowerCase().split(".").pop() || "";
  const map = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    mp3: "audio/mpeg", wav: "audio/wav",
    pdf: "application/pdf",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip", rar: "application/vnd.rar", "7z": "application/x-7z-compressed",
    json: "application/json", js: "text/javascript", ts: "text/typescript", css: "text/css", html: "text/html", md: "text/markdown", txt: "text/plain",
  };
  return map[ext] || "application/octet-stream";
}
