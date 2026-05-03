from pathlib import Path
from datetime import datetime
import sys

TARGET = Path("src/components/ecosystem/FeaturedProjects.jsx")

def fail(message):
    print(f"[hydrate_discover_featured_project_branding] ERROR: {message}")
    sys.exit(1)

def main():
    print("[hydrate_discover_featured_project_branding] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()
    original = text

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-discover-branding-hydration-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original)

    bridge = r'''
// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER FEATURED PROJECT BRANDING HYDRATION BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// /discovery/trending may return a lightweight project object without the newest
// branding fields. Hydrate each visible real project from /projects/:id so
// ProjectAvatar receives logoUrl/bannerUrl exactly like Projects.jsx/ProjectHome.
function getProjectId(project) {
  return project?._id || project?.id || project?.projectId || '';
}

function hasProjectBranding(project) {
  return Boolean(
    project?.logoUrl ||
      project?.logo ||
      project?.picture ||
      project?.avatarUrl ||
      project?.imageUrl ||
      project?.bannerUrl ||
      project?.banner ||
      project?.coverUrl ||
      project?.coverImageUrl
  );
}

function unwrapProjectResponse(payload) {
  if (!payload) return null;
  if (payload?.data?.data && typeof payload.data.data === 'object') return payload.data.data;
  if (payload?.data && typeof payload.data === 'object') return payload.data;
  if (typeof payload === 'object') return payload;
  return null;
}

async function hydrateProjectBranding(project) {
  const projectId = getProjectId(project);

  if (!project || !projectId || String(projectId).startsWith('demo-')) {
    return project;
  }

  if (hasProjectBranding(project)) {
    return project;
  }

  try {
    const response = await client.get(`/projects/${projectId}`);
    const fullProject = unwrapProjectResponse(response);

    if (!fullProject || typeof fullProject !== 'object') {
      return project;
    }

    return {
      ...project,
      ...fullProject,
      _id: fullProject._id || project._id || project.id,
      id: fullProject._id || fullProject.id || project.id || project._id,
      name: fullProject.name || project.name || project.title || project.projectName,
      title: fullProject.title || fullProject.name || project.title || project.name,
      logoUrl:
        fullProject.logoUrl ||
        fullProject.logo ||
        fullProject.picture ||
        fullProject.avatarUrl ||
        fullProject.imageUrl ||
        project.logoUrl ||
        project.logo ||
        project.picture ||
        project.avatarUrl ||
        project.imageUrl ||
        '',
      bannerUrl:
        fullProject.bannerUrl ||
        fullProject.banner ||
        fullProject.coverUrl ||
        fullProject.coverImageUrl ||
        project.bannerUrl ||
        project.banner ||
        project.coverUrl ||
        project.coverImageUrl ||
        '',
    };
  } catch (error) {
    console.warn('[FeaturedProjects] Branding hydration skipped:', projectId, error?.message || error);
    return project;
  }
}
'''

    if "DISCOVER FEATURED PROJECT BRANDING HYDRATION BRIDGE" not in text:
        marker = "function ProjectCard({ project, initialFollowing }) {"
        if marker not in text:
            fail("could not find ProjectCard marker")
        text = text.replace(marker, bridge + "\n" + marker, 1)
        print("[patched] inserted branding hydration helpers")
    else:
        print("[skip] branding hydration helpers already present")

    old = "const mapped = sourceItems.slice(0, maxVisible).map(p => {"
    new = """const hydratedSourceItems = await Promise.all(
            sourceItems.slice(0, maxVisible).map(hydrateProjectBranding)
          );

          const mapped = hydratedSourceItems.map(p => {"""

    if new in text:
        print("[skip] sourceItems hydration already wired")
    elif old in text:
        text = text.replace(old, new, 1)
        print("[patched] hydrated sourceItems before FeaturedProjects mapping")
    else:
        fail("could not find sourceItems mapping line")

    old_return_piece = """return {
              ...p,
              id: p._id || p.id,
              name: p.name || p.projectName || p.title,
              title: p.title || p.name || p.projectName,"""

    new_return_piece = """return {
              ...p,
              id: p._id || p.id,
              name: p.name || p.projectName || p.title,
              title: p.title || p.name || p.projectName,
              logoUrl: p.logoUrl || p.logo || p.picture || p.avatarUrl || p.imageUrl || '',
              bannerUrl: p.bannerUrl || p.banner || p.coverUrl || p.coverImageUrl || '',
              logo: p.logo || p.logoUrl || p.picture || p.avatarUrl || p.imageUrl || '',
              avatarUrl: p.avatarUrl || p.logoUrl || p.logo || p.picture || p.imageUrl || '',
              imageUrl: p.imageUrl || p.logoUrl || p.logo || p.picture || p.avatarUrl || '',
              banner: p.banner || p.bannerUrl || p.coverUrl || p.coverImageUrl || '',
              coverUrl: p.coverUrl || p.bannerUrl || p.banner || p.coverImageUrl || '',"""

    if "logoUrl: p.logoUrl || p.logo || p.picture || p.avatarUrl || p.imageUrl || ''," in text:
        print("[skip] explicit branding fields already preserved in mapped project")
    elif old_return_piece in text:
        text = text.replace(old_return_piece, new_return_piece, 1)
        print("[patched] preserved explicit branding fields in mapped project")
    else:
        fail("could not find mapped project return block")

    TARGET.write_text(text)

    updated = TARGET.read_text()

    required = [
        "DISCOVER FEATURED PROJECT BRANDING HYDRATION BRIDGE",
        "hydrateProjectBranding",
        "const hydratedSourceItems = await Promise.all",
        "logoUrl: p.logoUrl || p.logo || p.picture || p.avatarUrl || p.imageUrl || '',",
        "bannerUrl: p.bannerUrl || p.banner || p.coverUrl || p.coverImageUrl || '',",
        "<ProjectAvatar",
    ]

    for needle in required:
        if needle not in updated:
            fail(f"missing expected marker after patch: {needle}")

    print(f"[hydrate_discover_featured_project_branding] backup created: {backup}")
    print("[hydrate_discover_featured_project_branding] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n \"DISCOVER FEATURED PROJECT BRANDING HYDRATION BRIDGE|hydrateProjectBranding|hydratedSourceItems|logoUrl|bannerUrl|ProjectAvatar\" src/components/ecosystem/FeaturedProjects.jsx -C 8')
    print("  git diff -- src/components/ecosystem/FeaturedProjects.jsx")

if __name__ == "__main__":
    main()
