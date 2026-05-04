#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime

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

def replace_method(text: str, method_name: str, replacement: str) -> str:
    marker = f"  private {method_name}"
    start = text.find(marker)
    if start == -1:
        raise SystemExit(f"[enrich_project_overview_live_activity_actors] ERROR: method marker not found: {marker}")

    open_brace = text.find("{", start)
    if open_brace == -1:
        raise SystemExit(f"[enrich_project_overview_live_activity_actors] ERROR: opening brace not found for {method_name}")

    close_brace = find_matching_brace(text, open_brace)
    if close_brace == -1:
        raise SystemExit(f"[enrich_project_overview_live_activity_actors] ERROR: closing brace not found for {method_name}")

    return text[:start] + replacement.rstrip() + "\n" + text[close_brace + 1:]

def main():
    print("[enrich_project_overview_live_activity_actors] starting")

    if not TARGET.exists():
        raise SystemExit(f"[enrich_project_overview_live_activity_actors] ERROR: missing {TARGET}")

    text = TARGET.read_text()

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-live-activity-actor-enrichment-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)

    replacement = r'''
  // PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE
  // Live Activity is derived from tasks, but the card needs a real actor
  // object so it can display the correct user name and avatar instead of
  // falling back to "Project member".
  private normalizeActorId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (value?._id) return this.normalizeActorId(value._id);
    if (value?.id) return this.normalizeActorId(value.id);
    if (value?.userId) return this.normalizeActorId(value.userId);
    if (value?.user) return this.normalizeActorId(value.user);

    if (typeof value?.toString === 'function') {
      const raw = value.toString();
      if (raw && raw !== '[object Object]') return raw;
    }

    return '';
  }

  private getActorDisplayName(value: any): string {
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

  private getActorAvatar(value: any): string {
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

  private serializeActivityActor(value: any, fallbackLabel = 'Project member'): any {
    const id = this.normalizeActorId(value);
    const name = this.getActorDisplayName(value) || fallbackLabel;
    const avatarUrl = this.getActorAvatar(value);

    return {
      _id: id || undefined,
      id: id || undefined,
      name,
      displayName: name,
      username: value?.username || undefined,
      email: value?.email || undefined,
      avatarUrl: avatarUrl || undefined,
      profilePicture: avatarUrl || undefined,
      avatar: avatarUrl || undefined,
    };
  }

  private buildProjectActorLookup(project: any): Map<string, any> {
    const actors = new Map<string, any>();

    const addActor = (candidate: any) => {
      if (!candidate) return;

      const actor = candidate?.userId || candidate?.user || candidate?.member || candidate;
      const id = this.normalizeActorId(actor);

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

  private resolveActivityActor(task: any, project: any, fallbackUserId?: string): any {
    const actors = this.buildProjectActorLookup(project);

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
        const directName = this.getActorDisplayName(candidate);
        const directAvatar = this.getActorAvatar(candidate);

        if (directName || directAvatar) {
          return candidate;
        }
      }

      const id = this.normalizeActorId(candidate);
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
        const actor = this.resolveActivityActor(task, project, fallbackUserId);
        const serializedActor = this.serializeActivityActor(actor, 'Project member');

        const type = this.isTaskDone(task)
          ? 'task_completed'
          : this.isTaskInProgress(task)
            ? 'task_in_progress'
            : 'task_updated';

        const action = this.isTaskDone(task)
          ? 'completed'
          : this.isTaskInProgress(task)
            ? 'moved to work'
            : 'updated';

        const target = task?.title || 'Task';

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
          createdAt: task?.updatedAt || task?.createdAt || new Date().toISOString(),
          updatedAt: task?.updatedAt || task?.createdAt || new Date().toISOString(),
          status: task?.status || 'todo',
        };
      });
  }
'''

    text = replace_method(text, "buildRecentActivity", replacement)

    old_call = "const activity = this.buildRecentActivity(tasks);"
    new_call = "const activity = this.buildRecentActivity(tasks, project, userId);"

    if old_call not in text:
        raise SystemExit("[enrich_project_overview_live_activity_actors] ERROR: buildRecentActivity call not found")

    text = text.replace(old_call, new_call, 1)

    if "PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE" not in text:
        raise SystemExit("[enrich_project_overview_live_activity_actors] ERROR: actor bridge was not inserted")

    if new_call not in text:
        raise SystemExit("[enrich_project_overview_live_activity_actors] ERROR: buildRecentActivity call was not updated")

    TARGET.write_text(text)

    print(f"[enrich_project_overview_live_activity_actors] backup created: {backup}")
    print("[enrich_project_overview_live_activity_actors] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT OVERVIEW LIVE ACTIVITY ACTOR BRIDGE|buildRecentActivity\\(tasks, project, userId\\)|resolveActivityActor|serializeActivityActor|actorName|actorAvatar" src/projects/projects.service.ts -C 6')
    print("  git diff -- src/projects/projects.service.ts")

if __name__ == "__main__":
    main()
