from pathlib import Path
from datetime import datetime

TARGET = Path("src/projects/projects.service.ts")

POPULATE_FIELDS = "name firstName lastName username email avatar avatarUrl profilePicture profileImage imageUrl photoUrl headline bio"

def fail(message):
    raise SystemExit(f"[populate_project_list_member_avatars] ERROR: {message}")

def main():
    print("[populate_project_list_member_avatars] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()

    marker = "async findUserProjects("
    start = text.find(marker)
    if start == -1:
        fail("could not find findUserProjects method")

    end_marker = "return { projects, total };"
    end = text.find(end_marker, start)
    if end == -1:
        fail("could not find findUserProjects return marker")

    region = text[start:end]

    if ".populate('ownerId'" in region and ".populate('members.userId'" in region:
        print("[populate_project_list_member_avatars] populate calls already present in findUserProjects")
        return

    old = """this.projectModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(offset)
        .limit(limit),"""

    new = f"""this.projectModel
        .find(query)
        .populate('ownerId', '{POPULATE_FIELDS}')
        .populate('members.userId', '{POPULATE_FIELDS}')
        .sort({{ [sortBy]: sortOrder === 'asc' ? 1 : -1 }})
        .skip(offset)
        .limit(limit),"""

    if old not in region:
        fail("expected findUserProjects project query block was not found")

    updated_region = region.replace(old, new, 1)
    updated = text[:start] + updated_region + text[end:]

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".ts.bak.before-project-list-member-avatar-populate-{timestamp}")
    backup.write_text(text)
    TARGET.write_text(updated)

    print(f"[populate_project_list_member_avatars] backup created: {backup}")
    print("[populate_project_list_member_avatars] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"populate\\('ownerId'|populate\\('members.userId'|findUserProjects\" src/projects/projects.service.ts -C 8")
    print("  git diff -- src/projects/projects.service.ts")

if __name__ == "__main__":
    main()
