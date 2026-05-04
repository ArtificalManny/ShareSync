from pathlib import Path
from datetime import datetime

TARGET = Path("src/components/insights/ActivityFeed.jsx")

def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(
            f"[fix_insights_activity_no_global_current_user_fallback] ERROR: {label}: "
            f"expected {expected}, found {count}"
        )
    return text.replace(old, new, expected)

def main():
    print("[fix_insights_activity_no_global_current_user_fallback] starting")

    if not TARGET.exists():
        raise SystemExit(f"[fix_insights_activity_no_global_current_user_fallback] ERROR: missing {TARGET}")

    text = TARGET.read_text()
    original = text

    required_markers = [
        "function buildNormalizedActivityItem(item, fallbackActor = null)",
        "function ActivityAvatar({ item, config, fallbackActor })",
        "function ActivityRow({ item, fallbackActor })",
        "items = await fetchTaskBasedActivity(projectId, limit, currentUser);",
        "const normalizedItems = normalizeActivityList(items, currentUser);",
    ]

    for marker in required_markers:
        if marker not in text:
            raise SystemExit(
                f"[fix_insights_activity_no_global_current_user_fallback] ERROR: missing marker: {marker}"
            )

    # 1) Do NOT use current logged-in user as fallback for every real activity row.
    old = """function buildNormalizedActivityItem(item, fallbackActor = null) {
  const actorName = getActorName(item, fallbackActor);
  const actorAvatar = getActorAvatar(item, fallbackActor);
  const title = getTitle(item);

  return {"""

    new = """function buildNormalizedActivityItem(item, fallbackActor = null) {
  // INSIGHTS ACTIVITY ACTOR SAFETY BRIDGE
  // Do not globally fall back to the current logged-in user for every row.
  // Only task-fallback items are allowed to use fallbackActor because real
  // activity endpoint rows should display their own actor, or no actor.
  const shouldUseFallbackActor = Boolean(item?.__useFallbackActor);
  const actorFallback = shouldUseFallbackActor ? fallbackActor : null;
  const actorName = getActorName(item, actorFallback);
  const actorAvatar = getActorAvatar(item, actorFallback);
  const title = getTitle(item);

  return {"""

    text = replace_exact(text, old, new, "buildNormalizedActivityItem fallback guard")

    # 2) Guard ActivityAvatar too, so image lookup cannot silently borrow current user.
    old = """function ActivityAvatar({ item, config, fallbackActor }) {
  const Icon = config.icon;
  const name = getActorName(item, fallbackActor) || 'Project member';
  const avatar = getActorAvatar(item, fallbackActor);
  const initials = getInitials(name);"""

    new = """function ActivityAvatar({ item, config, fallbackActor }) {
  const Icon = config.icon;
  const actorFallback = Boolean(item?.__useFallbackActor) ? fallbackActor : null;
  const name = getActorName(item, actorFallback) || 'Project member';
  const avatar = getActorAvatar(item, actorFallback);
  const initials = getInitials(name);"""

    text = replace_exact(text, old, new, "ActivityAvatar fallback guard")

    # 3) Guard ActivityRow label lookup and pass the guarded fallback to ActivityAvatar.
    old = """function ActivityRow({ item, fallbackActor }) {
  const config = getConfigForItem(item);
  const who = getActorName(item, fallbackActor) || 'Project member';
  const title = getTitle(item);
  const ago = timeAgo(item?.createdAt || item?.timestamp || item?.updatedAt);"""

    new = """function ActivityRow({ item, fallbackActor }) {
  const config = getConfigForItem(item);
  const actorFallback = Boolean(item?.__useFallbackActor) ? fallbackActor : null;
  const who = getActorName(item, actorFallback) || 'Project member';
  const title = getTitle(item);
  const ago = timeAgo(item?.createdAt || item?.timestamp || item?.updatedAt);"""

    text = replace_exact(text, old, new, "ActivityRow fallback guard")

    old = """<ActivityAvatar item={item} config={config} fallbackActor={fallbackActor} />"""
    new = """<ActivityAvatar item={item} config={config} fallbackActor={actorFallback} />"""

    text = replace_exact(text, old, new, "ActivityAvatar guarded prop")

    # 4) Mark task-fallback-generated rows as fallback-safe.
    # These are synthetic rows created by the frontend when the real activity endpoint is empty.
    text = text.replace(
        """_id: `${task._id || task.id}-completed`,
          type: 'TASK_COMPLETED',""",
        """_id: `${task._id || task.id}-completed`,
          __useFallbackActor: true,
          type: 'TASK_COMPLETED',"""
    )

    text = text.replace(
        """_id: `${task._id || task.id}-in-progress`,
          type: 'task_in_progress',""",
        """_id: `${task._id || task.id}-in-progress`,
          __useFallbackActor: true,
          type: 'task_in_progress',"""
    )

    text = text.replace(
        """_id: `${task._id || task.id}-created`,
        type: 'TASK_CREATED',""",
        """_id: `${task._id || task.id}-created`,
        __useFallbackActor: true,
        type: 'TASK_CREATED',"""
    )

    if text == original:
        raise SystemExit("[fix_insights_activity_no_global_current_user_fallback] ERROR: no changes made")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".jsx.bak.before-no-global-current-user-fallback-{timestamp}")
    backup.write_text(original)
    TARGET.write_text(text)

    updated = TARGET.read_text()

    verify_markers = [
        "INSIGHTS ACTIVITY ACTOR SAFETY BRIDGE",
        "const shouldUseFallbackActor = Boolean(item?.__useFallbackActor);",
        "const actorFallback = Boolean(item?.__useFallbackActor) ? fallbackActor : null;",
        "__useFallbackActor: true,",
        "fallbackActor={actorFallback}",
    ]

    for marker in verify_markers:
        if marker not in updated:
            raise SystemExit(
                f"[fix_insights_activity_no_global_current_user_fallback] ERROR: verification missing: {marker}"
            )

    print(f"[fix_insights_activity_no_global_current_user_fallback] backup created: {backup}")
    print("[fix_insights_activity_no_global_current_user_fallback] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "INSIGHTS ACTIVITY ACTOR SAFETY BRIDGE|__useFallbackActor|actorFallback|fallbackActor=\\{actorFallback\\}" src/components/insights/ActivityFeed.jsx -C 6')
    print("  git diff -- src/components/insights/ActivityFeed.jsx")

if __name__ == "__main__":
    main()
