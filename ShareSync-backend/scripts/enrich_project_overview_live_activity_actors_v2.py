#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re

TARGET = Path("src/projects/projects.service.ts")

def find_matching_brace(text: str, open_index: int) -> int:
    depth = 0
    in_string = None
    escape = False
    in_line_comment = False
    in_block_comment = False

    i = open_index
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""

        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_string:
                in_string = None
            i += 1
            continue

        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue

        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue

        if ch in ("'", '"', "`"):
            in_string = ch
            i += 1
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i

        i += 1

    return -1

def replace_private_method(text: str, method_name: str, replacement: str) -> str:
    marker = f"  private {method_name}"
    start = text.find(marker)

    if start == -1:
        raise SystemExit(
            f"[enrich_project_overview_live_activity_actors_v2] ERROR: method marker not found: {marker}"
        )

    open_brace = text.find("{", start)
    if open_brace == -1:
        raise SystemExit(
            f"[enrich_project_overview_live_activity_actors_v2] ERROR: opening brace not found for {method_name}"
        )

    close_brace = find_matching_brace(text, open_brace)
    if close_brace == -1:
        raise SystemExit(
            f"[enrich_project_overview_live_activity_actors_v2] ERROR: closing brace not found for {method_name}"
        )

    return text[:start] + replacement.rstrip() + "\n" + text[close_brace + 1:]

def patch_build_recent_activity_call(text: str) -> str:
    already_patched = "this.buildRecentActivity(tasks, project, userId)" in text

    if already_patched:
        print("[enrich_project_overview_live_activity_actors_v2] buildRecentActivity call already passes project + userId")
        return text

    pattern = re.compile(
        r"this\.buildRecentActivity\s*\(\s*tasks\s*(?:,\s*[^)]*)?\)",
        re.MULTILINE,
    )

    matches = list(pattern.finditer(text))

    if not matches:
        print("[enrich_project_overview_live_activity_actors_v2] DEBUG: buildRecentActivity references found:")
        for index, line in enumerate(text.splitlines(), start=1):
            if "buildRecentActivity" in line:
                print(f"  {index}: {line}")

        raise SystemExit(
            "[enrich_project_overview_live_activity_actors_v2] ERROR: could not find a patchable this.buildRecentActivity(...) call"
        )

    first = matches[0]
    patched = text[:first.start()] + "this.buildRecentActivity(tasks, project, userId)" + text[first.end():]

    print(
        f"[enrich_project_overview_live_activity_actors_v2] patched buildRecentActivity call at character {first.start()}"
    )

    return patched

def main():
    print("[enrich_project_overview_live_activity_actors_v2] starting")

    if not TARGET.exists():
        raise SystemExit(
            f"[enrich_project_overview_live_activity_actors_v2] ERROR: missing {TARGET}"
        )

    original = TARGET.read_text()
    text = original

    replacement = r'''
  // PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE
  // Live Activity is derived from tasks, but the card needs a real actor object
  // so it can display the correct user name and avatar instead of falling back
  // to "Project member".
  private projectOverviewNormalizeActorId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (value?._id) return this.projectOverviewNormalizeActorId(value._id);
    if (value?.id) return this.projectOverviewNormalizeActorId(value.id);
    if (value?.userId) return this.projectOverviewNormalizeActorId(value.userId);
    if (value?.user) return this.projectOverviewNormalizeActorId(value.user);

    if (typeof value?.toString === 'function') {
      const raw = value.toString();
      if (raw && raw !== '[object Object]') return raw;
    }

    return '';
  }

  private projectOverviewGetActorDisplayName(value: any): string {
    if (!value || typeof value !== 'object') return '';

    const fullName = [value.firstName, value.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      value.name ||
      value.displayName ||
      fullName ||
      value.username ||
      value.email ||
      ''
    );
  }

  private projectOverviewGetActorAvatar(value: any): string {
    if (!value || typeof value !== 'object') return '';

    return (
      value.avatarUrl ||
      value.profilePicture ||
      value.profileImage ||
      value.avatar ||
      value.imageUrl ||
      value.picture ||
      value.photoURL ||
      ''
    );
  }

  private projectOverviewSerializeActivityActor(value: any, fallbackLabel = 'Project member'): any {
    const id = this.projectOverviewNormalizeActorId(value);
    const name = this.projectOverviewGetActorDisplayName(value) || fallbackLabel;
    const avatarUrl = this.projectOverviewGetActorAvatar(value);

    return {
      _id: id || undefined,
      id: id || undefined,
      name,
      displayName: name,
      username: value?.username || undefined,
      email: value?.email || undefined,
      avatarUrl: avatarUrl || undefined,
      profilePicture: avatarUrl || undefined,
      profileImage: avatarUrl || undefined,
      avatar: avatarUrl || undefined,
    };
  }

  private projectOverviewBuildActorLookup(project: any): Map<string, any> {
    const actors = new Map<string, any>();

    const addActor = (candidate: any) => {
      if (!candidate) return;

      const actor = candidate?.userId || candidate?.user || candidate?.member || candidate;
      const id = this.projectOverviewNormalizeActorId(actor);

      if (!id) return;

      actors.set(id, actor);
    };

    addActor(project?.ownerId);
    addActor(project?.owner);
    addActor((project as any)?.createdBy);
    addActor((project as any)?.createdById);

    const members = Array.isArray(project?.members) ? project.members : [];
    for (const member of members) {
      addActor(member);
    }

    return actors;
  }

  private projectOverviewResolveActivityActor(task: any, project: any, fallbackUserId?: string): any {
    const actors = this.projectOverviewBuildActorLookup(project);

    const candidates = [
      task?.completedBy,
      task?.completedById,
      task?.lastUpdatedBy,
      task?.updatedBy,
      task?.updatedById,
      task?.modifiedBy,
      task?.modifiedById,
      task?.actor,
      task?.actorId,
      task?.user,
      task?.userId,
      task?.assignee,
      task?.assigneeId,
      task?.assignedTo,
      task?.assignedToId,
      task?.createdBy,
      task?.createdById,
      fallbackUserId,
      project?.ownerId,
      project?.owner,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (typeof candidate === 'object') {
        const directName = this.projectOverviewGetActorDisplayName(candidate);
        const directAvatar = this.projectOverviewGetActorAvatar(candidate);

        if (directName || directAvatar) {
          return candidate;
        }
      }

      const id = this.projectOverviewNormalizeActorId(candidate);
      if (id && actors.has(id)) {
        return actors.get(id);
      }
    }

    return null;
  }

  private buildRecentActivity(tasks: any[], project?: any, fallbackUserId?: string): any[] {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    return [...tasks]
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 8)
      .map((task) => {
        const actor = this.projectOverviewResolveActivityActor(task, project, fallbackUserId);
        const serializedActor = this.projectOverviewSerializeActivityActor(actor, 'Project member');

        const normalizedStatus = String(task?.status || '').toLowerCase();
        const taskIsDone = this.isTaskDone(task);
        const taskIsInProgress =
          normalizedStatus === 'in_progress' ||
          normalizedStatus === 'in-progress' ||
          normalizedStatus === 'progress' ||
          normalizedStatus === 'doing';

        const type = taskIsDone
          ? 'task_completed'
          : taskIsInProgress
            ? 'task_in_progress'
            : 'task_updated';

        const action = taskIsDone
          ? 'completed'
          : taskIsInProgress
            ? 'started'
            : 'updated';

        const target = task?.title || task?.name || 'Task';
        const timestamp = task?.updatedAt || task?.createdAt || new Date().toISOString();

        return {
          id: task?._id?.toString?.() || task?.id,
          taskId: task?._id?.toString?.() || task?.id,
          type,
          action,
          target,
          title: target,
          message: `${serializedActor.name} ${action} ${target}`,
          text: `${serializedActor.name} ${action} ${target}`,
          actor: serializedActor,
          actorId: serializedActor.id,
          actorName: serializedActor.name,
          actorAvatar: serializedActor.avatarUrl,
          avatarUrl: serializedActor.avatarUrl,
          profilePicture: serializedActor.profilePicture,
          profileImage: serializedActor.profileImage,
          createdAt: timestamp,
          updatedAt: timestamp,
          status: task?.status || 'todo',
        };
      });
  }
'''

    text = replace_private_method(text, "buildRecentActivity", replacement)
    text = patch_build_recent_activity_call(text)

    if "PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE" not in text:
        raise SystemExit(
            "[enrich_project_overview_live_activity_actors_v2] ERROR: bridge marker missing after patch"
        )

    if "this.buildRecentActivity(tasks, project, userId)" not in text:
        raise SystemExit(
            "[enrich_project_overview_live_activity_actors_v2] ERROR: buildRecentActivity call still does not pass project + userId"
        )

    if text == original:
        print("[enrich_project_overview_live_activity_actors_v2] no changes needed")
        return

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-live-activity-actor-enrichment-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original)

    TARGET.write_text(text)

    print(f"[enrich_project_overview_live_activity_actors_v2] backup created: {backup}")
    print("[enrich_project_overview_live_activity_actors_v2] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE|buildRecentActivity\\(tasks, project, userId\\)|projectOverviewResolveActivityActor|projectOverviewSerializeActivityActor|actorName|actorAvatar" src/projects/projects.service.ts -C 6')
    print("  git diff -- src/projects/projects.service.ts")

if __name__ == "__main__":
    main()
