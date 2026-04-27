#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/ecosystem/FeaturedProjects.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_featured_projects_visible_empty_state] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_featured_projects_visible_empty_state] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "function ProjectCard({ project, initialFollowing }) {",
        "export default function FeaturedProjects",
        "const [projects, setProjects] = useState([]);",
        "const sorted = [...filtered].sort((a, b) => {",
        "if (projects.length === 0) return null;",
        "sorted.map((project) => {",
        "Live Ranking",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Insert empty state component before FeaturedProjects export.
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

    if "function FeaturedProjectsEmptyState()" not in source:
        source = source.replace(
            "export default function FeaturedProjects",
            empty_state + "export default function FeaturedProjects",
            1,
        )
        print("[fix_featured_projects_visible_empty_state] inserted FeaturedProjectsEmptyState")
    else:
        print("[fix_featured_projects_visible_empty_state] FeaturedProjectsEmptyState already present")

    # 2) Remove the early return-null that makes the whole section disappear.
    if "if (projects.length === 0) return null;" in source:
        source = source.replace(
            "  if (projects.length === 0) return null;\n\n",
            "",
            1,
        )
        print("[fix_featured_projects_visible_empty_state] removed early null return")
    else:
        print("[fix_featured_projects_visible_empty_state] early null return already removed")

    # 3) Replace actual current sorted.map render block with conditional empty state.
    old_block = """      {/* Project cards — each card manages its own follow state via useFollow hook */}
      <div className="space-y-3">
        {sorted.map((project) => {
          const pid = project._id || project.id;
          return (
            <ProjectCard
              key={pid}
              project={project}
              initialFollowing={!!followStatuses[pid]}
            />
          );
        })}
      </div>"""

    new_block = """      {/* Project cards — each card manages its own follow state via useFollow hook */}
      <div className="space-y-3">
        {sorted.length > 0 ? (
          sorted.map((project) => {
            const pid = project._id || project.id;
            return (
              <ProjectCard
                key={pid}
                project={project}
                initialFollowing={!!followStatuses[pid]}
              />
            );
          })
        ) : (
          <FeaturedProjectsEmptyState />
        )}
      </div>"""

    if "sorted.length > 0 ? (" not in source:
        if old_block not in source:
            fail("Could not find exact sorted.map render block to replace.")
        source = source.replace(old_block, new_block, 1)
        print("[fix_featured_projects_visible_empty_state] patched sorted render with empty state")
    else:
        print("[fix_featured_projects_visible_empty_state] sorted render already has empty state")

    required_after = [
        "function FeaturedProjectsEmptyState()",
        "No public listed projects yet",
        "sorted.length > 0 ? (",
        "<FeaturedProjectsEmptyState />",
        "Live Ranking",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if "if (projects.length === 0) return null;" in source:
        fail("Safety check failed: early return null still exists.")

    if source == original:
        print("[fix_featured_projects_visible_empty_state] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-visible-empty-state-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_featured_projects_visible_empty_state] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_featured_projects_visible_empty_state] patched: {TARGET}")

    print("")
    print("[fix_featured_projects_visible_empty_state] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"FeaturedProjectsEmptyState|No public listed projects yet|sorted.length > 0|return null|sorted.map|Live Ranking\" src/components/ecosystem/FeaturedProjects.jsx -C 8")
    print("  git diff -- src/components/ecosystem/FeaturedProjects.jsx")


if __name__ == "__main__":
    main()
