from pathlib import Path
import sys

ROOT = Path.cwd()

PROJECT_HOME = ROOT / "src/pages/ProjectHome.jsx"
PROJECT_AVATAR = ROOT / "src/components/project/ProjectAvatar.jsx"
PROJECT_VISUALS = ROOT / "src/utils/projectVisuals.js"

PROJECT_AVATAR_CODE = r'''import React from "react";
import { getProjectVisuals } from "../../utils/projectVisuals";

const SIZE_CLASSES = {
  xs: {
    shell: "w-8 h-8 rounded-xl text-sm",
    glyph: "text-base",
    initials: "text-[11px]",
  },
  sm: {
    shell: "w-10 h-10 rounded-xl text-base",
    glyph: "text-lg",
    initials: "text-xs",
  },
  md: {
    shell: "w-12 h-12 rounded-2xl text-xl",
    glyph: "text-xl",
    initials: "text-sm",
  },
  lg: {
    shell: "w-14 h-14 rounded-2xl text-2xl",
    glyph: "text-2xl",
    initials: "text-base",
  },
  xl: {
    shell: "w-16 h-16 rounded-[1.25rem] text-2xl",
    glyph: "text-2xl",
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

  const accessibleTitle =
    title ||
    visual?.label ||
    `${project?.name || project?.title || "Project"} avatar`;

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
            "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.9), transparent 42%)",
        }}
      />

      {visual.imageUrl ? (
        <img
          src={visual.imageUrl}
          alt=""
          className="relative z-10 w-full h-full object-cover"
          draggable="false"
        />
      ) : visual.glyph ? (
        <span
          className={`relative z-10 leading-none ${sizeClasses.glyph}`}
          aria-hidden="true"
        >
          {visual.glyph}
        </span>
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
'''

PROJECT_VISUALS_CODE = r'''const DEFAULT_PROJECT_ICONS = new Set([
  "📁",
  "📂",
  "🗂",
  "🗂️",
  "folder",
  "Folder",
]);

const TONES = {
  violet: {
    foreground: "#7c3aed",
    bgFrom: "rgba(124, 58, 237, 0.14)",
    bgTo: "rgba(168, 85, 247, 0.08)",
    border: "rgba(124, 58, 237, 0.18)",
    shadow: "0 12px 28px rgba(124, 58, 237, 0.10)",
  },
  hospitality: {
    foreground: "#db2777",
    bgFrom: "rgba(244, 114, 182, 0.16)",
    bgTo: "rgba(251, 191, 36, 0.10)",
    border: "rgba(219, 39, 119, 0.18)",
    shadow: "0 12px 28px rgba(219, 39, 119, 0.10)",
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
    foreground: "#06b6d4",
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
    tone: "hospitality",
    glyph: "🍸",
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
    tone: "construction",
    glyph: "🏗️",
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
    tone: "education",
    glyph: "📚",
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
    tone: "software",
    glyph: "💻",
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
      "open",
      "share",
    ],
  },
  {
    tone: "marketing",
    glyph: "📣",
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
    tone: "finance",
    glyph: "💼",
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
  return normalizeText([
    project?.name,
    project?.title,
    project?.projectName,
    project?.category,
    project?.type,
    project?.kind,
    project?.description,
  ].filter(Boolean).join(" "));
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

function getExplicitIcon(project = {}) {
  const value = (
    project?.icon ||
    project?.emoji ||
    project?.glyph ||
    project?.coverGlyph ||
    ""
  );

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (DEFAULT_PROJECT_ICONS.has(trimmed)) return "";

  return trimmed;
}

function getProjectInitials(name) {
  const cleaned = String(name || "Project")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);

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
  const explicitIcon = getExplicitIcon(project);
  const matchedRule = findRule(project);
  const baseTone = TONES[matchedRule?.tone] || TONES.violet;
  const tone = makeToneFromColor(project?.color, baseTone);

  const glyph = explicitIcon || matchedRule?.glyph || "";

  return {
    name,
    imageUrl,
    glyph,
    initials: getProjectInitials(name),
    label: matchedRule?.label || `${name} project`,
    foreground: tone.foreground,
    border: tone.border,
    shadow: tone.shadow,
    background: `linear-gradient(135deg, ${tone.bgFrom}, ${tone.bgTo})`,
  };
}
'''

def fail(message):
    print(f"\n[apply_project_avatar_phase1] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def write_if_changed(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        current = path.read_text(encoding="utf-8")
        if current == content:
            print(f"[apply_project_avatar_phase1] unchanged: {path}")
            return

        backup = path.with_suffix(path.suffix + ".bak-project-avatar-phase1")
        if not backup.exists():
            backup.write_text(current, encoding="utf-8")
            print(f"[apply_project_avatar_phase1] backup created: {backup}")

    path.write_text(content, encoding="utf-8")
    print(f"[apply_project_avatar_phase1] wrote: {path}")

def patch_project_home():
    if not PROJECT_HOME.exists():
        fail(f"Could not find {PROJECT_HOME}")

    source = PROJECT_HOME.read_text(encoding="utf-8")
    original = source

    import_anchor = 'import CompleteProjectModal from "../components/project/CompleteProjectModal";\n'
    import_line = 'import ProjectAvatar from "../components/project/ProjectAvatar";\n'

    if import_line not in source:
        if import_anchor not in source:
            fail(
                "Could not find CompleteProjectModal import anchor in ProjectHome.jsx. "
                "No changes were made to ProjectHome.jsx."
            )

        source = source.replace(import_anchor, import_anchor + import_line, 1)
        print("[apply_project_avatar_phase1] added ProjectAvatar import")

    old_icon_block = '''          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
            style={{
              backgroundColor: (project?.color || "#8b5cf6") + "15",
              color: project?.color || "#8b5cf6",
            }}
          >
            {project?.icon || "📁"}
          </div>'''

    new_icon_block = '''          <ProjectAvatar
            project={project}
            size="lg"
            className="flex-shrink-0"
          />'''

    if old_icon_block in source:
        source = source.replace(old_icon_block, new_icon_block, 1)
        print("[apply_project_avatar_phase1] replaced inline project icon block")
    elif new_icon_block in source:
        print("[apply_project_avatar_phase1] ProjectAvatar block already present")
    else:
        fail(
            "Could not find the exact inline project icon block in ProjectHome.jsx. "
            "This protects your file from a risky partial patch. "
            "Search manually for project?.icon or 📁 before changing anything."
        )

    if source != original:
        backup = PROJECT_HOME.with_suffix(PROJECT_HOME.suffix + ".bak-project-avatar-phase1")
        if not backup.exists():
            backup.write_text(original, encoding="utf-8")
            print(f"[apply_project_avatar_phase1] backup created: {backup}")

        PROJECT_HOME.write_text(source, encoding="utf-8")
        print(f"[apply_project_avatar_phase1] patched: {PROJECT_HOME}")
    else:
        print("[apply_project_avatar_phase1] ProjectHome.jsx already up to date")

def main():
    print("[apply_project_avatar_phase1] starting frontend-only ProjectAvatar patch")
    write_if_changed(PROJECT_VISUALS, PROJECT_VISUALS_CODE)
    write_if_changed(PROJECT_AVATAR, PROJECT_AVATAR_CODE)
    patch_project_home()
    print("[apply_project_avatar_phase1] done")
    print("")
    print("Next checks:")
    print("  npm run dev")
    print("  npm run build")
    print("  git diff -- src/pages/ProjectHome.jsx src/components/project/ProjectAvatar.jsx src/utils/projectVisuals.js")

if __name__ == "__main__":
    main()
