#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/ecosystem/FeaturedProjects.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_featured_projects_public_discover_filter] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_featured_projects_public_discover_filter] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "const FALLBACK_FEATURED = [",
        "function pluralize(count, singular, plural) {",
        "const { data } = await client.get('/discovery/trending', { params: { limit: maxVisible } });",
        "const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);",
        "const mapped = items.length > 0 ? items.slice(0, maxVisible).map(p => {",
        "}) : FALLBACK_FEATURED;",
        "if (!cancelled) setProjects(FALLBACK_FEATURED);",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add an explicit opt-in flag for demo projects.
    old_fallback_header = """const FALLBACK_FEATURED = [
  { id: 'demo-1', name: 'ShareSync Platform', description: 'The project management tool that builds momentum', emoji: '🚀', memberCount: 12, shipCount: 34, tags: ['saas', 'productivity'], streak: 45, completionRate: 72 },
  { id: 'demo-2', name: 'Design System v2', description: 'Component library with dark mode and animations', emoji: '🎨', memberCount: 5, shipCount: 18, tags: ['design', 'ui'], streak: 12, completionRate: 58 },
  { id: 'demo-3', name: 'AI Study Buddy', description: 'Flashcards that adapt to your learning pace', emoji: '🧠', memberCount: 3, shipCount: 8, tags: ['ai', 'education'], streak: 7, completionRate: 35 },
];"""

    new_fallback_header = """const SHOW_DEMO_FEATURED = import.meta.env.VITE_SHOW_DISCOVER_DEMOS === 'true';

const FALLBACK_FEATURED = [
  { id: 'demo-1', name: 'ShareSync Platform', description: 'The project management tool that builds momentum', emoji: '🚀', memberCount: 12, shipCount: 34, tags: ['saas', 'productivity'], streak: 45, completionRate: 72, isPublic: true, isListed: true, discoverable: true },
  { id: 'demo-2', name: 'Design System v2', description: 'Component library with dark mode and animations', emoji: '🎨', memberCount: 5, shipCount: 18, tags: ['design', 'ui'], streak: 12, completionRate: 58, isPublic: true, isListed: true, discoverable: true },
  { id: 'demo-3', name: 'AI Study Buddy', description: 'Flashcards that adapt to your learning pace', emoji: '🧠', memberCount: 3, shipCount: 8, tags: ['ai', 'education'], streak: 7, completionRate: 35, isPublic: true, isListed: true, discoverable: true },
];"""

    if "const SHOW_DEMO_FEATURED" not in source:
        source = source.replace(old_fallback_header, new_fallback_header, 1)
        print("[wire_featured_projects_public_discover_filter] added explicit demo opt-in flag")
    else:
        print("[wire_featured_projects_public_discover_filter] demo opt-in flag already present")

    # 2) Add defensive public/discoverable helpers.
    old_pluralize = """function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}"""

    new_pluralize = """function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true' || lowered === 'yes' || lowered === '1') return true;
    if (lowered === 'false' || lowered === 'no' || lowered === '0') return false;
  }
  return Boolean(value);
}

function isPublicDiscoverableProject(project) {
  if (!project || typeof project !== 'object') return false;

  const visibility = String(project.visibility || project.privacy || '').trim().toLowerCase();
  const settings = project.settings || {};

  const isPublic =
    project.isPublic === true ||
    settings.isPublic === true ||
    visibility === 'public' ||
    visibility === 'listed';

  const isListed =
    project.isListed === true ||
    project.discoverable === true ||
    settings.isListed === true ||
    settings.discoverable === true ||
    normalizeBoolean(project.isListed) ||
    normalizeBoolean(project.discoverable);

  return isPublic && isListed;
}"""

    if "function isPublicDiscoverableProject(project)" not in source:
        source = source.replace(old_pluralize, new_pluralize, 1)
        print("[wire_featured_projects_public_discover_filter] added defensive public/listed filter helpers")
    else:
        print("[wire_featured_projects_public_discover_filter] public/listed filter helpers already present")

    # 3) Replace the data mapping block so empty real responses stay empty.
    old_mapping_start = """        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        if (!cancelled) {
          const mapped = items.length > 0 ? items.slice(0, maxVisible).map(p => {"""

    new_mapping_start = """        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        const visibleItems = items.filter(isPublicDiscoverableProject);
        const sourceItems = visibleItems.length > 0
          ? visibleItems
          : SHOW_DEMO_FEATURED
            ? FALLBACK_FEATURED
            : [];

        if (!cancelled) {
          const mapped = sourceItems.slice(0, maxVisible).map(p => {"""

    if "const visibleItems = items.filter(isPublicDiscoverableProject);" not in source:
        source = source.replace(old_mapping_start, new_mapping_start, 1)
        print("[wire_featured_projects_public_discover_filter] inserted public/listed source filtering")
    else:
        print("[wire_featured_projects_public_discover_filter] public/listed source filtering already present")

    old_mapping_end = """              momentumState: p.momentumState || p.state || '',
            };
          }) : FALLBACK_FEATURED;"""

    new_mapping_end = """              momentumState: p.momentumState || p.state || '',
            };
          });"""

    if "}) : FALLBACK_FEATURED;" in source:
        source = source.replace(old_mapping_end, new_mapping_end, 1)
        print("[wire_featured_projects_public_discover_filter] removed automatic demo fallback on empty response")
    else:
        print("[wire_featured_projects_public_discover_filter] automatic demo fallback already removed")

    # 4) Make catch preserve real empty state unless demos are explicitly enabled.
    old_catch = """      } catch {
        if (!cancelled) setProjects(FALLBACK_FEATURED);
      } finally {"""

    new_catch = """      } catch (err) {
        console.error('[FeaturedProjects] Failed to load public discoverable projects:', err);
        if (!cancelled) setProjects(SHOW_DEMO_FEATURED ? FALLBACK_FEATURED : []);
      } finally {"""

    if "Failed to load public discoverable projects" not in source:
        source = source.replace(old_catch, new_catch, 1)
        print("[wire_featured_projects_public_discover_filter] changed error fallback to explicit demo opt-in")
    else:
        print("[wire_featured_projects_public_discover_filter] error fallback already patched")

    required_after = [
        "const SHOW_DEMO_FEATURED = import.meta.env.VITE_SHOW_DISCOVER_DEMOS === 'true';",
        "function isPublicDiscoverableProject(project)",
        "const visibleItems = items.filter(isPublicDiscoverableProject);",
        "const sourceItems = visibleItems.length > 0",
        "SHOW_DEMO_FEATURED",
        "const mapped = sourceItems.slice(0, maxVisible).map(p => {",
        "setProjects(SHOW_DEMO_FEATURED ? FALLBACK_FEATURED : []);",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_featured_projects_public_discover_filter] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-discover-filter-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_featured_projects_public_discover_filter] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_featured_projects_public_discover_filter] patched: {TARGET}")

    print("")
    print("[wire_featured_projects_public_discover_filter] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"SHOW_DEMO_FEATURED|isPublicDiscoverableProject|visibleItems|sourceItems|FALLBACK_FEATURED|Failed to load public discoverable projects\" src/components/ecosystem/FeaturedProjects.jsx -C 8")
    print("  git diff -- src/components/ecosystem/FeaturedProjects.jsx")


if __name__ == "__main__":
    main()
