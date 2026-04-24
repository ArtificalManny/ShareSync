from pathlib import Path
import sys

ROOT = Path.cwd()

PROJECT_AVATAR = ROOT / "src/components/project/ProjectAvatar.jsx"
PROJECT_VISUALS = ROOT / "src/utils/projectVisuals.js"

PROJECT_AVATAR_CODE = """import React from "react";
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

export default function ProjectAvatar({
  project,
  size = "lg",
  className = "",
  title,
}) {
  const visual = getProjectVisuals(project);
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

      {visual.imageUrl ? (
        <img
          src={visual.imageUrl}
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
"""

PROJECT_VISUALS_CODE = """const TONES = {
  violet: {
    foreground: "#7c3aed",
    bgFrom: "rgba(124, 58, 237, 0.14)",
    bgTo: "rgba(168, 85, 247, 0.08)",
    border: "rgba(124, 58, 237, 0.18)",
    shadow: "0 12px 28px rgba(124, 58, 237, 0.10)",
  },
  hospitality: {
    foreground: "#7c3aed",
    bgFrom: "rgba(139, 92, 246, 0.12)",
    bgTo: "rgba(196, 181, 253, 0.12)",
    border: "rgba(139, 92, 246, 0.16)",
    shadow: "0 12px 28px rgba(124, 58, 237, 0.08)",
  },
  construction: {
    foreground: "#d97706",
    bgFrom: "rgba(245, 158, 11, 0.16)",
    bgTo: "rgba(251, 191, 36, 0.10)",
    border: "rgba(217, 119, 6, 0.20)",
    shadow: "0 12px 28px rgba(217, 119, 6, 0.10)",
  },
  education: {
    foreground: "#2563eb",
    bgFrom: "rgba(59, 130, 246, 0.14)",
    bgTo: "rgba(14, 165, 233, 0.08)",
    border: "rgba(37, 99, 235, 0.18)",
    shadow: "0 12px 28px rgba(37, 99, 235, 0.10)",
  },
  software: {
    foreground: "#0891b2",
    bgFrom: "rgba(6, 182, 212, 0.14)",
    bgTo: "rgba(124, 58, 237, 0.08)",
    border: "rgba(6, 182, 212, 0.18)",
    shadow: "0 12px 28px rgba(6, 182, 212, 0.10)",
  },
  business: {
    foreground: "#475569",
    bgFrom: "rgba(100, 116, 139, 0.14)",
    bgTo: "rgba(148, 163, 184, 0.08)",
    border: "rgba(100, 116, 139, 0.18)",
    shadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  },
  marketing: {
    foreground: "#ea580c",
    bgFrom: "rgba(249, 115, 22, 0.14)",
    bgTo: "rgba(236, 72, 153, 0.08)",
    border: "rgba(234, 88, 12, 0.18)",
    shadow: "0 12px 28px rgba(234, 88, 12, 0.10)",
  },
  finance: {
    foreground: "#059669",
    bgFrom: "rgba(16, 185, 129, 0.14)",
    bgTo: "rgba(45, 212, 191, 0.08)",
    border: "rgba(5, 150, 105, 0.18)",
    shadow: "0 12px 28px rgba(5, 150, 105, 0.10)",
  },
};

const PROJECT_VISUAL_RULES = [
  {
    iconKey: "hospitality",
    tone: "hospitality",
    label: "Hospitality project",
    keywords: [
      "bar",
      "snicker",
      "snickers",
      "restaurant",
      "cafe",
      "coffee",
      "food",
      "drink",
      "kitchen",
      "menu",
      "venue",
      "hospitality",
      "lounge",
    ],
  },
  {
    iconKey: "construction",
    tone: "construction",
    label: "Construction project",
    keywords: [
      "construction",
      "site",
      "layout",
      "blueprint",
      "build",
      "building",
      "contractor",
      "nccer",
      "floorplan",
      "floor plan",
      "renovation",
      "development",
    ],
  },
  {
    iconKey: "education",
    tone: "education",
    label: "Education project",
    keywords: [
      "school",
      "class",
      "course",
      "homework",
      "assignment",
      "study",
      "chemistry",
      "precalculus",
      "math",
      "essay",
      "student",
    ],
  },
  {
    iconKey: "software",
    tone: "software",
    label: "Software project",
    keywords: [
      "app",
      "website",
      "software",
      "frontend",
      "backend",
      "code",
      "coding",
      "react",
      "api",
      "platform",
      "openshare",
      "sharesync",
    ],
  },
  {
    iconKey: "marketing",
    tone: "marketing",
    label: "Marketing project",
    keywords: [
      "marketing",
      "campaign",
      "launch",
      "brand",
      "content",
      "social",
      "ads",
      "growth",
      "go-to-market",
      "gtm",
    ],
  },
  {
    iconKey: "finance",
    tone: "finance",
    label: "Finance project",
    keywords: [
      "budget",
      "finance",
      "cashflow",
      "cash flow",
      "invest",
      "investment",
      "pricing",
      "revenue",
      "subscription",
      "money",
    ],
  },
];

const ALLOWED_ICON_KEYS = new Set([
  "project",
  "hospitality",
  "construction",
  "education",
  "software",
  "business",
  "marketing",
  "finance",
]);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .trim();
}

function getProjectName(project = {}) {
  return (
    project?.name ||
    project?.title ||
    project?.projectName ||
    "Project"
  );
}

function getProjectText(project = {}) {
  return normalizeText(
    [
      project?.name,
      project?.title,
      project?.projectName,
      project?.category,
      project?.type,
      project?.kind,
      project?.description,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getProjectImage(project = {}) {
  return (
    project?.imageUrl ||
    project?.avatarUrl ||
    project?.iconUrl ||
    project?.coverUrl ||
    project?.logoUrl ||
    ""
  );
}

function normalizeStoredIconKey(value) {
  const normalized = normalizeText(value).replace(/\\s+/g, "_");

  if (!normalized) return "";

  const aliasMap = {
    restaurant: "hospitality",
    food: "hospitality",
    venue: "hospitality",
    bar: "hospitality",
    hospitality: "hospitality",
    build: "construction",
    builder: "construction",
    construction: "construction",
    school: "education",
    education: "education",
    software: "software",
    code: "software",
    dev: "software",
    business: "business",
    marketing: "marketing",
    finance: "finance",
    money: "finance",
  };

  const mapped = aliasMap[normalized] || normalized;
  return ALLOWED_ICON_KEYS.has(mapped) ? mapped : "";
}

function getStoredIconKey(project = {}) {
  return (
    normalizeStoredIconKey(project?.iconKey) ||
    normalizeStoredIconKey(project?.avatarKey) ||
    normalizeStoredIconKey(project?.visual?.iconKey) ||
    ""
  );
}

function getProjectInitials(name) {
  const cleaned = String(name || "Project")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9\\s]/g, " ")
    .trim();

  const parts = cleaned.split(/\\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || "P"}${parts[1][0] || ""}`.toUpperCase();
  }

  const single = parts[0] || "Project";
  return single.slice(0, 2).toUpperCase();
}

function findRule(project = {}) {
  const text = getProjectText(project);

  return PROJECT_VISUAL_RULES.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword))
  );
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "").trim());
}

function hexToRgb(hex) {
  if (!isHexColor(hex)) return null;

  const raw = hex.replace("#", "");

  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function rgbaFromHex(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function makeToneFromColor(color, fallbackTone) {
  if (!isHexColor(color)) return fallbackTone;

  return {
    ...fallbackTone,
    foreground: color,
    bgFrom: rgbaFromHex(color, 0.15) || fallbackTone.bgFrom,
    bgTo: rgbaFromHex(color, 0.07) || fallbackTone.bgTo,
    border: rgbaFromHex(color, 0.20) || fallbackTone.border,
    shadow: `0 12px 28px ${rgbaFromHex(color, 0.10) || "rgba(124, 58, 237, 0.10)"}`,
  };
}

export function getProjectVisuals(project = {}) {
  const name = getProjectName(project);
  const imageUrl = getProjectImage(project);
  const storedIconKey = getStoredIconKey(project);
  const matchedRule = findRule(project);

  const iconKey = storedIconKey || matchedRule?.iconKey || "project";
  const baseTone = TONES[matchedRule?.tone] || TONES.violet;
  const tone = makeToneFromColor(project?.color, baseTone);

  return {
    name,
    imageUrl,
    iconKey,
    initials: getProjectInitials(name),
    label: matchedRule?.label || `${name} project`,
    foreground: tone.foreground,
    border: tone.border,
    shadow: tone.shadow,
    background: `linear-gradient(135deg, ${tone.bgFrom}, ${tone.bgTo})`,
  };
}
"""

def fail(message):
    print(f"\\n[replace_project_avatar_with_professional_icons] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def write_with_backup(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        current = path.read_text(encoding="utf-8")
        backup = path.with_suffix(path.suffix + ".bak-professional-icons")
        if not backup.exists():
            backup.write_text(current, encoding="utf-8")
            print(f"[backup] created: {backup}")

    path.write_text(content, encoding="utf-8")
    print(f"[write] {path}")

def main():
    if not PROJECT_AVATAR.parent.exists():
        fail(f"Missing folder: {PROJECT_AVATAR.parent}")

    if not PROJECT_VISUALS.parent.exists():
        fail(f"Missing folder: {PROJECT_VISUALS.parent}")

    write_with_backup(PROJECT_AVATAR, PROJECT_AVATAR_CODE)
    write_with_backup(PROJECT_VISUALS, PROJECT_VISUALS_CODE)

    print("\\nDone.")
    print("Files updated:")
    print(f" - {PROJECT_AVATAR}")
    print(f" - {PROJECT_VISUALS}")
    print("\\nNo backend files were touched.")
    print("ProjectHome.jsx does not need changes for this pass.")

if __name__ == "__main__":
    main()
