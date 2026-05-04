from pathlib import Path
from datetime import datetime

TARGET = Path("src/projects/projects.service.ts")

POPULATE_FIELDS = (
    "name firstName lastName username email "
    "avatar avatarUrl profilePicture profileImage imageUrl photoUrl headline bio"
)

def fail(message):
    raise SystemExit(f"[populate_project_list_member_avatars_v2] ERROR: {message}")

def main():
    print("[populate_project_list_member_avatars_v2] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()
    original = text

    method_marker = "async findUserProjects("
    method_start = text.find(method_marker)

    if method_start == -1:
        fail("could not find async findUserProjects(")

    promise_marker = "const [projects, total] = await Promise.all(["
    promise_start = text.find(promise_marker, method_start)

    if promise_start == -1:
        fail("could not find project list Promise.all block inside findUserProjects")

    # Keep the search tight so we only patch the project-list query, not unrelated queries.
    patch_window_start = promise_start
    patch_window_end = text.find("]);", promise_start)

    if patch_window_end == -1:
        fail("could not find closing ]); for project list Promise.all block")

    patch_window = text[patch_window_start:patch_window_end]

    if ".populate('ownerId'" in patch_window and ".populate('members.userId'" in patch_window:
        print("[populate_project_list_member_avatars_v2] populate calls already present")
        return

    old_chain = """this.projectModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(offset)
        .limit(limit)"""

    new_chain = f"""this.projectModel
        .find(query)
        .populate('ownerId', '{POPULATE_FIELDS}')
        .populate('members.userId', '{POPULATE_FIELDS}')
        .sort({{ [sortBy]: sortOrder === 'asc' ? 1 : -1 }})
        .skip(offset)
        .limit(limit)"""

    if old_chain not in patch_window:
        fail("expected project list query chain was not found inside Promise.all block")

    updated_window = patch_window.replace(old_chain, new_chain, 1)
    updated = text[:patch_window_start] + updated_window + text[patch_window_end:]

    if updated == original:
        fail("no changes were produced")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(
        f".ts.bak.before-project-list-member-avatar-populate-v2-{timestamp}"
    )

    backup.write_text(original)
    TARGET.write_text(updated)

    print(f"[populate_project_list_member_avatars_v2] backup created: {backup}")
    print("[populate_project_list_member_avatars_v2] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"populate\\('ownerId'|populate\\('members.userId'|findUserProjects|Promise.all\" src/projects/projects.service.ts -C 8")
    print("  git diff -- src/projects/projects.service.ts")

if __name__ == "__main__":
    main()
