from pathlib import Path
from datetime import datetime

TARGET = Path("src/components/insights/ActivityFeed.jsx")

def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(
            f"[fix_insights_activity_read_populated_userid] ERROR: {label}: "
            f"expected {expected}, found {count}"
        )
    return text.replace(old, new, expected)

def main():
    print("[fix_insights_activity_read_populated_userid] starting")

    if not TARGET.exists():
        raise SystemExit(f"[fix_insights_activity_read_populated_userid] ERROR: missing {TARGET}")

    text = TARGET.read_text()
    original = text

    required_markers = [
        "function getActorCandidateObjects(item)",
        "function getDisplayNameFromUserLike(userLike)",
        "function getAvatarFromUserLike(userLike)",
        "item.actor,",
    ]

    for marker in required_markers:
        if marker not in text:
            raise SystemExit(
                f"[fix_insights_activity_read_populated_userid] ERROR: missing marker: {marker}"
            )

    # Main fix:
    # The backend returns populated user data under item.userId.
    # The Insights parser was checking item.actor/item.user/etc. but not item.userId,
    # so it fell back to "Project member" even though userId had the real name/avatar.
    old = """  return [
    item.actor,
    item.user,
    item.member,"""

    new = """  return [
    // INSIGHTS ACTIVITY POPULATED USERID BRIDGE
    // GET /projects/:projectId/activity returns populated actor data under userId.
    item.userId,
    item.actor,
    item.user,
    item.member,"""

    text = replace_exact(
        text,
        old,
        new,
        "add item.userId to actor candidate objects",
    )

    # Add nested userId fallbacks too, in case future rows wrap actor data in payload/metadata/details.
    old = """    item.payload?.actor,
    item.payload?.user,
    item.payload?.createdBy,"""

    new = """    item.payload?.actor,
    item.payload?.user,
    item.payload?.userId,
    item.payload?.createdBy,"""

    text = replace_exact(
        text,
        old,
        new,
        "add payload.userId actor candidate",
    )

    old = """    item.metadata?.actor,
    item.metadata?.user,
    item.metadata?.createdBy,"""

    new = """    item.metadata?.actor,
    item.metadata?.user,
    item.metadata?.userId,
    item.metadata?.createdBy,"""

    text = replace_exact(
        text,
        old,
        new,
        "add metadata.userId actor candidate",
    )

    old = """    item.details?.actor,
    item.details?.user,
  ].filter(Boolean);"""

    new = """    item.details?.actor,
    item.details?.user,
    item.details?.userId,
  ].filter(Boolean);"""

    text = replace_exact(
        text,
        old,
        new,
        "add details.userId actor candidate",
    )

    if text == original:
        raise SystemExit("[fix_insights_activity_read_populated_userid] ERROR: no changes made")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".jsx.bak.before-read-populated-userid-{timestamp}")
    backup.write_text(original)
    TARGET.write_text(text)

    updated = TARGET.read_text()

    verify_markers = [
        "INSIGHTS ACTIVITY POPULATED USERID BRIDGE",
        "item.userId,",
        "item.payload?.userId,",
        "item.metadata?.userId,",
        "item.details?.userId,",
    ]

    for marker in verify_markers:
        if marker not in updated:
            raise SystemExit(
                f"[fix_insights_activity_read_populated_userid] ERROR: verification missing: {marker}"
            )

    print(f"[fix_insights_activity_read_populated_userid] backup created: {backup}")
    print("[fix_insights_activity_read_populated_userid] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "INSIGHTS ACTIVITY POPULATED USERID BRIDGE|item\\.userId|payload\\?\\.userId|metadata\\?\\.userId|details\\?\\.userId|getActorCandidateObjects" src/components/insights/ActivityFeed.jsx -C 8')
    print("  git diff -- src/components/insights/ActivityFeed.jsx")

if __name__ == "__main__":
    main()
