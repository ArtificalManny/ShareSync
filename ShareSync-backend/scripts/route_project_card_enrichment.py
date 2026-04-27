#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/projects.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[route_project_card_enrichment] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[route_project_card_enrichment] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    old_find_by_user = """  async findByUser(userId: string): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId);
    // Enrich with computed task aggregates so the Projects list cards
    // (ProjectCardV2) can display real momentum/risk/progress instead of
    // generic placeholder labels. Returns plain objects, not hydrated
    // Mongoose documents — typed any[] internally, but the return type
    // declaration is preserved for backwards compatibility with callers.
    return (await this.enrichProjectsWithCardData(result.projects)) as any;
  }"""

    new_find_by_user = """  async findByUser(userId: string): Promise<ProjectDocument[]> {
    const result = await this.findUserProjects(userId);
    return result.projects;
  }"""

    old_find_user_projects_return = """    const [projects, total] = await Promise.all([
      this.projectModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(offset)
        .limit(limit),
      this.projectModel.countDocuments(query),
    ]);

    return { projects, total };"""

    new_find_user_projects_return = """    const [projects, total] = await Promise.all([
      this.projectModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(offset)
        .limit(limit),
      this.projectModel.countDocuments(query),
    ]);

    const enrichedProjects = await this.enrichProjectsWithCardData(projects);

    return { projects: enrichedProjects as any, total };"""

    required_before = [
        "async findByUser(userId: string): Promise<ProjectDocument[]>",
        "async findUserProjects(userId: string, options: ProjectQueryOptions = {})",
        "private async enrichProjectsWithCardData",
        "return { projects, total };",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    changed = False

    if old_find_by_user in source:
        source = source.replace(old_find_by_user, new_find_by_user, 1)
        changed = True
        print("[route_project_card_enrichment] patched findByUser to avoid double enrichment")
    elif new_find_by_user in source:
        print("[route_project_card_enrichment] findByUser already patched")
    else:
        fail("Could not find exact findByUser block. Paste lines around async findByUser.")

    if old_find_user_projects_return in source:
        source = source.replace(old_find_user_projects_return, new_find_user_projects_return, 1)
        changed = True
        print("[route_project_card_enrichment] patched findUserProjects return path")
    elif "const enrichedProjects = await this.enrichProjectsWithCardData(projects);" in source:
        print("[route_project_card_enrichment] findUserProjects already enriches projects")
    else:
        fail("Could not find exact findUserProjects return block. Paste lines around const [projects, total].")

    required_after = [
        new_find_by_user,
        "const enrichedProjects = await this.enrichProjectsWithCardData(projects);",
        "return { projects: enrichedProjects as any, total };",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if not changed or source == original:
        print("[route_project_card_enrichment] no changes needed")
        return

    backup_path = TARGET.with_name(f"{TARGET.name}.bak-route-card-enrichment-{STAMP}")
    backup_path.write_text(original, encoding="utf-8")
    print(f"[route_project_card_enrichment] backup created: {backup_path}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[route_project_card_enrichment] patched: {TARGET}")

    print("")
    print("[route_project_card_enrichment] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"async findByUser|enrichProjectsWithCardData|const enrichedProjects|return \\\\{ projects: enrichedProjects as any, total \\\\}\" src/projects/projects.service.ts -C 8")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
