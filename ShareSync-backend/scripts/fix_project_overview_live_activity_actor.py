from pathlib import Path
from datetime import datetime
import re
import shutil

TARGET = Path("src/projects/projects.service.ts")

def fail(message: str):
    raise SystemExit(f"[fix_project_overview_live_activity_actor] ERROR: {message}")

def backup_file(path: Path) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = path.with_suffix(path.suffix + f".bak.before-live-activity-actor-{stamp}")
    shutil.copy2(path, backup)
    return backup

def main():
    print("[fix_project_overview_live_activity_actor] starting")

    if not TARGET.exists():
        fail(f"missing target file: {TARGET}")

    text = TARGET.read_text()

    original = text

    # 1) Make overview activity builder receive the populated project.
    old_call = "const activity = this.buildRecentActivity(tasks);"
    new_call = "const activity = this.buildRecentActivity(tasks, project);"

    if old_call in text:
        text = text.replace(old_call, new_call, 1)
        print("[patched] getOverviewData now passes project into buildRecentActivity")
    elif new_call in text:
        print("[skip] getOverviewData already passes project into buildRecentActivity")
    else:
        fail("could not find buildRecentActivity call inside getOverviewData")

    # 2) Replace buildRecentActivity with actor-aware version.
    method_pattern = re.compile(
        r"  private buildRecentActivity\(tasks: any\[\]\): any\[\] \{\n[\s\S]*?\n  \}\n\n  private extractAnyId",
        re.MULTILINE,
    )

    replacement = r'''  private buildDisplayName(userLike: any, fallback = 'Someone'): string {
    if (!userLike) return fallback;

    if (typeof userLike === 'string' || typeof userLike === 'number') {
      return fallback;
    }

    const fullName = [userLike?.firstName, userLike?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      userLike?.name ||
      userLike?.fullName ||
      userLike?.displayName ||
      fullName ||
      userLike?.username ||
      userLike?.email ||
      fallback
    );
  }

  private buildAvatarUrl(userLike: any): string | null {
    if (!userLike || typeof userLike !== 'object') return null;

    return (
      userLike?.avatarUrl ||
      userLike?.profilePicture ||
      userLike?.avatar ||
      userLike?.photoUrl ||
      userLike?.imageUrl ||
      userLike?.profile?.avatarUrl ||
      userLike?.profile?.photoUrl ||
      null
    );
  }

  private unwrapProjectMemberUser(member: any): any {
    if (!member) return null;

    if (member?.userId && typeof member.userId === 'object') return member.userId;
    if (member?.user && typeof member.user === 'object') return member.user;
    if (member?.member && typeof member.member === 'object') return member.member;

    return member;
  }

  private findProjectMemberUserById(project: any, candidateId: any): any {
    const id = this.extractAnyId(candidateId);
    if (!id || !project) return null;

    const ownerId = this.extractAnyId(project?.ownerId || project?.owner);
    if (ownerId && ownerId === id) {
      return project?.ownerId || project?.owner;
    }

    const members = Array.isArray(project?.members) ? project.members : [];
    const matchedMember = members.find((member: any) => {
      const memberUser = this.unwrapProjectMemberUser(member);
      return this.extractAnyId(memberUser || member?.userId || member?.user) === id;
    });

    return matchedMember ? this.unwrapProjectMemberUser(matchedMember) : null;
  }

  private buildActivityActorSnapshot(task: any, project: any): any {
    const candidateUserObjects = [
      task?.updatedBy,
      task?.completedBy,
      task?.createdBy,
      task?.assignedTo,
      task?.assignee,
      task?.user,
      task?.owner,
    ].filter((value) => value && typeof value === 'object');

    const directUser = candidateUserObjects.find((value) => this.extractAnyId(value));
    if (directUser) {
      const actorId = this.extractAnyId(directUser);
      return {
        id: actorId,
        _id: actorId,
        name: this.buildDisplayName(directUser),
        username: directUser?.username || '',
        email: directUser?.email || '',
        avatarUrl: this.buildAvatarUrl(directUser),
        profilePicture: this.buildAvatarUrl(directUser),
      };
    }

    const candidateIds = [
      task?.updatedBy,
      task?.updatedById,
      task?.completedBy,
      task?.completedById,
      task?.createdBy,
      task?.createdById,
      task?.assigneeId,
      task?.assignedToId,
      task?.userId,
      task?.ownerId,
    ];

    for (const candidateId of candidateIds) {
      const matchedUser = this.findProjectMemberUserById(project, candidateId);
      if (matchedUser) {
        const actorId = this.extractAnyId(matchedUser);
        return {
          id: actorId,
          _id: actorId,
          name: this.buildDisplayName(matchedUser),
          username: matchedUser?.username || '',
          email: matchedUser?.email || '',
          avatarUrl: this.buildAvatarUrl(matchedUser),
          profilePicture: this.buildAvatarUrl(matchedUser),
        };
      }
    }

    const ownerLike = project?.ownerId || project?.owner || null;
    const ownerId = this.extractAnyId(ownerLike);

    return {
      id: ownerId || '',
      _id: ownerId || '',
      name: this.buildDisplayName(ownerLike, 'Project member'),
      username: ownerLike?.username || '',
      email: ownerLike?.email || '',
      avatarUrl: this.buildAvatarUrl(ownerLike),
      profilePicture: this.buildAvatarUrl(ownerLike),
    };
  }

  private buildRecentActivity(tasks: any[], project?: any): any[] {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    return [...tasks]
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 8)
      .map((task) => {
        const actor = this.buildActivityActorSnapshot(task, project);

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
        const actorName = actor?.name || 'Project member';
        const message = `${actorName} ${action} ${target}`;

        return {
          id: task?._id?.toString?.() || task?.id,
          type,
          action,
          target,
          title: message,
          message,
          description: message,
          createdAt: task?.updatedAt || task?.createdAt || new Date().toISOString(),
          status: task?.status || 'todo',

          // Actor fields for LiveActivityCard / ProjectActivityFeed / future UI.
          actor,
          actorId: actor?.id || actor?._id || '',
          actorName,
          userId: actor?.id || actor?._id || '',
          userName: actorName,
          username: actor?.username || '',
          avatar: actor?.avatarUrl || actor?.profilePicture || null,
          avatarUrl: actor?.avatarUrl || actor?.profilePicture || null,
          profilePicture: actor?.profilePicture || actor?.avatarUrl || null,
        };
      });
  }

  private extractAnyId'''

    matches = list(method_pattern.finditer(text))
    if len(matches) != 1:
        fail(f"buildRecentActivity method block: expected 1 match, found {len(matches)}")

    text = method_pattern.sub(replacement, text, count=1)
    print("[patched] buildRecentActivity now attaches actorName/avatar/userId/message")

    if text == original:
        fail("no changes were made")

    # Safety checks.
    required = [
        "buildActivityActorSnapshot",
        "findProjectMemberUserById",
        "buildRecentActivity(tasks, project)",
        "actorName",
        "avatarUrl",
        "profilePicture",
    ]

    missing = [token for token in required if token not in text]
    if missing:
        fail(f"verification failed, missing: {missing}")

    backup = backup_file(TARGET)
    TARGET.write_text(text)

    print(f"[fix_project_overview_live_activity_actor] backup created: {backup}")
    print("[fix_project_overview_live_activity_actor] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "buildActivityActorSnapshot|findProjectMemberUserById|buildRecentActivity\\(tasks, project\\)|actorName|avatarUrl|profilePicture" src/projects/projects.service.ts -C 8')
    print("  git diff -- src/projects/projects.service.ts")

if __name__ == "__main__":
    main()
