from pathlib import Path
import sys

ROOT = Path.cwd()

PROJECT_CARD = ROOT / "src/components/projects/ProjectCardV2.jsx"
PROJECT_AVATAR = ROOT / "src/components/project/ProjectAvatar.jsx"

def fail(message):
    print(f"\n[apply_project_card_avatar_v2] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[apply_project_card_avatar_v2] starting ProjectCardV2 avatar patch")

    if not PROJECT_CARD.exists():
        fail(f"Could not find {PROJECT_CARD}")

    if not PROJECT_AVATAR.exists():
        fail(
            f"Could not find {PROJECT_AVATAR}. "
            "Run the professional ProjectAvatar patch first before patching ProjectCardV2."
        )

    source = PROJECT_CARD.read_text(encoding="utf-8")
    original = source

    import_anchor = "import { useLivingCard } from '../../hooks/useLivingCard';\n"
    import_line = "import ProjectAvatar from '../project/ProjectAvatar';\n"

    if import_line not in source:
        if import_anchor not in source:
            fail(
                "Could not find the useLivingCard import anchor. "
                "No changes were written."
            )

        source = source.replace(import_anchor, import_anchor + import_line, 1)
        print("[apply_project_card_avatar_v2] added ProjectAvatar import")
    else:
        print("[apply_project_card_avatar_v2] ProjectAvatar import already present")

    old_emoji_line = "  const emoji = project?.icon || project?.emoji || '📁';\n"

    if old_emoji_line in source:
        source = source.replace(old_emoji_line, "", 1)
        print("[apply_project_card_avatar_v2] removed old emoji fallback line")
    else:
        print("[apply_project_card_avatar_v2] old emoji fallback line not found; continuing safely")

    old_icon_block = """            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `${color}14`,
                color,
              }}
            >
              {emoji}
            </div>"""

    new_icon_block = """            <ProjectAvatar
              project={project}
              size="md"
              className="transition-transform duration-200 group-hover:scale-105"
            />"""

    if old_icon_block in source:
        source = source.replace(old_icon_block, new_icon_block, 1)
        print("[apply_project_card_avatar_v2] replaced inline card emoji tile with ProjectAvatar")
    elif new_icon_block in source:
        print("[apply_project_card_avatar_v2] ProjectAvatar card block already present")
    else:
        fail(
            "Could not find the exact inline card icon block in ProjectCardV2.jsx. "
            "This protects the file from a risky partial patch. "
            "Search manually for `{emoji}` or `backgroundColor: `${color}14`` before changing anything."
        )

    if source == original:
        print("[apply_project_card_avatar_v2] ProjectCardV2.jsx already up to date")
        return

    backup = PROJECT_CARD.with_suffix(PROJECT_CARD.suffix + ".bak-project-card-avatar-v2")

    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[apply_project_card_avatar_v2] backup created: {backup}")

    PROJECT_CARD.write_text(source, encoding="utf-8")
    print(f"[apply_project_card_avatar_v2] patched: {PROJECT_CARD}")

    print("")
    print("[apply_project_card_avatar_v2] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  git diff -- src/components/projects/ProjectCardV2.jsx")

if __name__ == "__main__":
    main()
