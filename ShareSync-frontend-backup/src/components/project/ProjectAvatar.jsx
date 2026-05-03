import React from "react";
import {
  Briefcase,
  Building2,
  Code2,
  Folder,
  GraduationCap,
  Hammer,
  Landmark,
  Megaphone,
} from "lucide-react";
import { getProjectVisuals } from "../../utils/projectVisuals";

const ICONS = {
  project: Folder,
  hospitality: Building2,
  construction: Hammer,
  education: GraduationCap,
  software: Code2,
  business: Briefcase,
  marketing: Megaphone,
  finance: Landmark,
};

const SIZE_CLASSES = {
  xs: {
    shell: "w-8 h-8 rounded-xl",
    icon: "w-4 h-4",
    initials: "text-[11px]",
  },
  sm: {
    shell: "w-10 h-10 rounded-xl",
    icon: "w-5 h-5",
    initials: "text-xs",
  },
  md: {
    shell: "w-12 h-12 rounded-2xl",
    icon: "w-5 h-5",
    initials: "text-sm",
  },
  lg: {
    shell: "w-14 h-14 rounded-2xl",
    icon: "w-6 h-6",
    initials: "text-base",
  },
  xl: {
    shell: "w-16 h-16 rounded-[1.25rem]",
    icon: "w-7 h-7",
    initials: "text-lg",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT AVATAR BRANDING BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// Prefer uploaded project logos over symbolic icon/emoji fallbacks.
const RAW_PROJECT_ASSET_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:5050/api";

const PROJECT_ASSET_ORIGIN = String(RAW_PROJECT_ASSET_BASE)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function resolveProjectAssetUrl(value) {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return `${PROJECT_ASSET_ORIGIN}/${trimmed.replace(/^\/+/, "")}`;
  }

  return trimmed;
}

function getProjectLogoUrl(project, visual) {
  return resolveProjectAssetUrl(
    project?.logoUrl ||
      project?.logo ||
      project?.picture ||
      project?.avatarUrl ||
      project?.imageUrl ||
      visual?.imageUrl ||
      ""
  );
}


export default function ProjectAvatar({
  project,
  size = "lg",
  className = "",
  title,
}) {
  const visual = getProjectVisuals(project);
  const avatarImageUrl = getProjectLogoUrl(project, visual);
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.lg;
  const Icon = ICONS[visual.iconKey] || ICONS.project;

  const accessibleTitle =
    title ||
    visual?.label ||
    `${project?.name || project?.title || "Project"} icon`;

  const shellStyle = {
    background: visual.background,
    color: visual.foreground,
    borderColor: visual.border,
    boxShadow: visual.shadow,
  };

  return (
    <div
      className={`
        ${sizeClasses.shell}
        ${className}
        relative overflow-hidden
        flex items-center justify-center
        border shadow-sm flex-shrink-0
        select-none
      `}
      style={shellStyle}
      title={accessibleTitle}
      aria-label={accessibleTitle}
    >
      <div
        className="absolute inset-0 opacity-80 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.88), transparent 42%)",
        }}
      />

      {avatarImageUrl ? (
        <img
          src={avatarImageUrl}
          alt=""
          className="relative z-10 w-full h-full object-cover"
          draggable="false"
        />
      ) : Icon ? (
        <Icon
          className={`relative z-10 ${sizeClasses.icon}`}
          strokeWidth={2.1}
          aria-hidden="true"
        />
      ) : (
        <span
          className={`
            relative z-10
            font-extrabold tracking-tight leading-none
            ${sizeClasses.initials}
          `}
          aria-hidden="true"
        >
          {visual.initials}
        </span>
      )}
    </div>
  );
}
