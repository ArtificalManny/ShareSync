#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/ecosystem/FeaturedProjects.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[add_featured_projects_empty_state] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[add_featured_projects_empty_state] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "function ProjectCard({ project, initialFollowing }) {",
        "export default function FeaturedProjects",
        "projects.map",
        "LIVE RANKING",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # Add empty state component before FeaturedProjects export.
    empty_state_marker = "function FeaturedProjectsEmptyState() {"

    empty_state = """
function FeaturedProjectsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03] px-5 py-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center mb-4">
        <TrendingUp className="w-5 h-5 text-violet-500" />
      </div>

      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
        No public listed projects yet
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
        Projects appear here only when they are public and turned on for Discover/Search.
      </p>

      <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-zinc-500">
        Create a project → choose Public → enable Listed in Discover & Search.
      </p>
    </div>
  );
}

"""

    if empty_state_marker not in source:
        export_marker = "export default function FeaturedProjects"
        if export_marker not in source:
            fail("Could not find FeaturedProjects export insertion point.")
        source = source.replace(export_marker, empty_state + export_marker, 1)
        print("[add_featured_projects_empty_state] inserted empty state component")
    else:
        print("[add_featured_projects_empty_state] empty state component already present")

    # Replace the project list rendering with conditional empty state.
    old_render = """        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} initialFollowing={!!followStatus[project.id]} />
          ))}
        </div>"""

    new_render = """        <div className="space-y-3">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} initialFollowing={!!followStatus[project.id]} />
            ))
          ) : (
            <FeaturedProjectsEmptyState />
          )}
        </div>"""

    if "projects.length > 0 ? (" not in source:
        if old_render not in source:
            fail("Could not find project list render block to replace.")
        source = source.replace(old_render, new_render, 1)
        print("[add_featured_projects_empty_state] patched project list empty state")
    else:
        print("[add_featured_projects_empty_state] project list empty state already present")

    required_after = [
        "function FeaturedProjectsEmptyState()",
        "No public listed projects yet",
        "Projects appear here only when they are public",
        "projects.length > 0 ?",
        "<FeaturedProjectsEmptyState />",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[add_featured_projects_empty_state] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-empty-state-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[add_featured_projects_empty_state] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[add_featured_projects_empty_state] patched: {TARGET}")

    print("")
    print("[add_featured_projects_empty_state] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"FeaturedProjectsEmptyState|No public listed projects yet|projects.length > 0|FeaturedProjects\" src/components/ecosystem/FeaturedProjects.jsx -C 8")
    print("  git diff -- src/components/ecosystem/FeaturedProjects.jsx")


if __name__ == "__main__":
    main()
