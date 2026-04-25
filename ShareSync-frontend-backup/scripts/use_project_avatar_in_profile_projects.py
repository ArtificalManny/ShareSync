from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[use_project_avatar_in_profile_projects] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def add_project_avatar_import(source):
    if "ProjectAvatar" in source and "components/project/ProjectAvatar" in source:
        return source

    if "ProjectAvatar" in source and "../components/project/ProjectAvatar" in source:
        return source

    # Profile.jsx is in src/pages, so ../components/project/ProjectAvatar is the correct relative path.
    import_line = 'import ProjectAvatar from "../components/project/ProjectAvatar";\n'

    # Place it after other component imports if possible, otherwise after the React import block.
    anchor_candidates = [
        'import ProfilePhotoEditor from "../components/profile/ProfilePhotoEditor";\n',
        'import WorkPersonality from "../components/analytics/WorkPersonality";\n',
        'import TrendCharts from "../components/growth/TrendCharts";\n',
    ]

    for anchor in anchor_candidates:
        if anchor in source:
            return source.replace(anchor, anchor + import_line, 1)

    # Fallback: insert after last import statement at top.
    matches = list(re.finditer(r'^import .*?;\s*$', source, re.MULTILINE))
    if not matches:
        fail("Could not find import section. No changes were written.")

    last = matches[-1]
    return source[:last.end()] + "\n" + import_line + source[last.end():]

def replace_project_emoji_span(source):
    old = """                <span className="text-2xl shrink-0">{p.emoji || p.icon || '��'}</span>"""

    new = """                <ProjectAvatar
                  project={p}
                  size="sm"
                  className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                />"""

    if old in source:
        return source.replace(old, new, 1)

    # More flexible fallback for spacing variations.
    pattern = re.compile(
        r'\n\s*<span\s+className=["\']text-2xl shrink-0["\']>\s*\{p\.emoji\s*\|\|\s*p\.icon\s*\|\|\s*[\'"]📁[\'"]\}\s*</span>',
        re.MULTILINE,
    )

    patched, count = pattern.subn("\n" + new, source, count=1)

    if count != 1:
        fail("Could not find the profile project emoji span. No changes were written.")

    return patched

def main():
    print("[use_project_avatar_in_profile_projects] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_before = [
        "export default function Profile",
        "userProjects.map",
        "href={'/projects/' + (p._id || p.id)}",
        "p.emoji || p.icon || '📁'",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    source = add_project_avatar_import(source)
    source = replace_project_emoji_span(source)

    required_after = [
        'import ProjectAvatar from "../components/project/ProjectAvatar";',
        "userProjects.map",
        "href={'/projects/' + (p._id || p.id)}",
        "<ProjectAvatar",
        "project={p}",
        'size="sm"',
        "group-hover:scale-105",
        "RecentShipsPanel",
        "Impact Metrics",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if "p.emoji || p.icon || '📁'" in source:
        fail("Safety check failed. Old emoji fallback still exists after patch.")

    if source == original:
        print("[use_project_avatar_in_profile_projects] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-project-avatar-profile-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[use_project_avatar_in_profile_projects] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[use_project_avatar_in_profile_projects] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProjectAvatar|p\\.emoji|p\\.icon|userProjects.map|PROJECT PORTFOLIO|RecentShipsPanel|Impact Metrics\" src/pages/Profile.jsx -C 6")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
