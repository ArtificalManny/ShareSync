from pathlib import Path
from datetime import datetime
import sys

TARGET = Path("src/pages/ProjectHome.jsx")
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

HELPER_MARKER = "PROJECT HOME BANNER BRANDING BRIDGE"

HELPER_BLOCK = """// ─────────────────────────────────────────────────────────────────────────────
// PROJECT HOME BANNER BRANDING BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
const RAW_PROJECT_HOME_ASSET_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:5050/api";

const PROJECT_HOME_ASSET_ORIGIN = String(RAW_PROJECT_HOME_ASSET_BASE)
  .replace(/\\/api\\/?$/, "")
  .replace(/\\/$/, "");

function resolveProjectHomeAssetUrl(value) {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return `${PROJECT_HOME_ASSET_ORIGIN}/${trimmed.replace(/^\\/+/, "")}`;
  }

  return trimmed;
}

function getProjectBannerUrl(project) {
  return resolveProjectHomeAssetUrl(
    project?.bannerUrl ||
      project?.banner ||
      project?.coverUrl ||
      project?.coverImageUrl ||
      ""
  );
}

"""

BANNER_BLOCK = """      {getProjectBannerUrl(project) ? (
        <div className="mb-6 h-36 md:h-44 overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
          <img
            src={getProjectBannerUrl(project)}
            alt={`${project?.name || "Project"} banner`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

"""


def fail(message):
    print(f"[patch_project_home_banner_branding_only] ERROR: {message}")
    sys.exit(1)


def backup_file():
    backup = TARGET.with_suffix(TARGET.suffix + f".bak.before-project-home-banner-branding-{STAMP}")
    backup.write_text(TARGET.read_text())
    return backup


def find_line_start(text, index):
    return text.rfind("\n", 0, index) + 1


def main():
    print("[patch_project_home_banner_branding_only] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()
    original = text

    project_header_idx = text.find("function ProjectHeader(")
    if project_header_idx == -1:
        fail("could not find function ProjectHeader(")

    # Insert helper before ProjectHeader if missing.
    if HELPER_MARKER not in text:
        text = text[:project_header_idx] + HELPER_BLOCK + text[project_header_idx:]
        print("[patched] inserted ProjectHome banner helper")
    else:
        print("[skip] ProjectHome banner helper already present")

    if "getProjectBannerUrl(project) ? (" in text:
        print("[skip] ProjectHome banner render block already present")
    else:
        project_header_idx = text.find("function ProjectHeader(")
        if project_header_idx == -1:
            fail("could not find function ProjectHeader( after helper insertion")

        # Find the first breadcrumb nav inside ProjectHeader.
        search_start = project_header_idx
        nav_idx = text.find("<nav", search_start)

        if nav_idx == -1:
            fail("could not find a <nav tag inside/after ProjectHeader")

        # Safety: ensure the nav appears before the main title area.
        title_idx = text.find("<ProjectAvatar", search_start)
        if title_idx == -1:
            fail("could not find ProjectAvatar inside/after ProjectHeader")

        if nav_idx > title_idx:
            fail("found <nav after ProjectAvatar, which is not the expected ProjectHeader breadcrumb nav")

        insert_at = find_line_start(text, nav_idx)
        text = text[:insert_at] + BANNER_BLOCK + text[insert_at:]
        print("[patched] inserted ProjectHome banner render block before breadcrumb nav")

    if text == original:
        print("[patch_project_home_banner_branding_only] no changes needed")
        return

    backup = backup_file()
    TARGET.write_text(text)

    print(f"[patch_project_home_banner_branding_only] backup created: {backup}")
    print("[patch_project_home_banner_branding_only] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT HOME BANNER BRANDING BRIDGE|getProjectBannerUrl|bannerUrl|ProjectAvatar|function ProjectHeader" src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
