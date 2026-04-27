#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/notifications/notifications.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_notifications_simple_follow_fallback] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_notifications_simple_follow_fallback] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class NotificationsService",
        "@Optional()",
        "@InjectModel(ProjectFollow.name)",
        "private readonly projectFollowModel?: Model<ProjectFollowDocument>,",
        "private async getInAppFollowerUserIds(projectId: string): Promise<string[]> {",
        "if (!this.projectFollowModel) return [];",
        "const follows = await this.projectFollowModel",
        "async notifyFollowersShipUpdate(args:",
        "async notifyFollowersMilestoneReached(args:",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add optional simple Follow model injection.
    old_constructor_piece = """    @Optional()
    @InjectModel(ProjectFollow.name)
    private readonly projectFollowModel?: Model<ProjectFollowDocument>,

    // ✅ Phase 12: Email + SMS fan-out channels"""

    new_constructor_piece = """    @Optional()
    @InjectModel(ProjectFollow.name)
    private readonly projectFollowModel?: Model<ProjectFollowDocument>,

    // ✅ Phase 5: simple Follow fallback.
    // The active frontend Follow button currently writes to the simple
    // Follow collection through /api/follows/:projectId. Keep ProjectFollow
    // support, but also read from Follow so current followers receive updates.
    @Optional()
    @InjectModel('Follow')
    private readonly followModel?: Model<any>,

    // ✅ Phase 12: Email + SMS fan-out channels"""

    if "private readonly followModel?: Model<any>," not in source:
        if old_constructor_piece not in source:
            fail("Could not find ProjectFollow constructor injection block.")
        source = source.replace(old_constructor_piece, new_constructor_piece, 1)
        print("[wire_notifications_simple_follow_fallback] added optional simple Follow model injection")
    else:
        print("[wire_notifications_simple_follow_fallback] optional simple Follow model already present")

    # 2) Replace follower lookup helper with merged ProjectFollow + Follow lookup.
    old_helper = """  private async getInAppFollowerUserIds(projectId: string): Promise<string[]> {
    // ✅ Safe boot: if follows model isn't registered, follower notifications are disabled
    if (!this.projectFollowModel) return [];

    const pid = new Types.ObjectId(projectId);

    const follows = await this.projectFollowModel
      .find({
        projectId: pid,
        'channelPrefs.inApp': true,
      })
      .select(['userId'])
      .lean();

    return (follows || [])
      .map((f: any) => f?.userId?.toString?.())
      .filter(Boolean);
  }"""

    new_helper = """  private normalizeFollowerUserIds(values: Array<string | null | undefined>): string[] {
    return Array.from(
      new Set(
        (values || [])
          .map((value) => String(value || '').trim())
          .filter((value) => value && value !== 'undefined' && value !== 'null'),
      ),
    );
  }

  private async getInAppFollowerUserIds(projectId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(projectId)) {
      this.logger.warn(`Follower notification skipped: invalid projectId ${projectId}`);
      return [];
    }

    const pid = new Types.ObjectId(projectId);
    const followerIds: string[] = [];

    // Newer spectator-follow system with notification preferences.
    if (this.projectFollowModel) {
      try {
        const projectFollows = await this.projectFollowModel
          .find({
            projectId: pid,
            'channelPrefs.inApp': true,
          })
          .select(['userId'])
          .lean();

        followerIds.push(
          ...(projectFollows || [])
            .map((follow: any) => follow?.userId?.toString?.())
            .filter(Boolean),
        );
      } catch (err: any) {
        this.logger.warn(
          `ProjectFollow follower lookup failed for project ${projectId}: ${err?.message}`,
        );
      }
    }

    // Current/simple follow system used by /api/follows/:projectId.
    // No per-channel prefs here, so a simple Follow means in-app updates are enabled.
    if (this.followModel) {
      try {
        const simpleFollows = await this.followModel
          .find({ projectId: pid })
          .select(['userId'])
          .lean();

        followerIds.push(
          ...(simpleFollows || [])
            .map((follow: any) => follow?.userId?.toString?.())
            .filter(Boolean),
        );
      } catch (err: any) {
        this.logger.warn(
          `Simple Follow lookup failed for project ${projectId}: ${err?.message}`,
        );
      }
    }

    return this.normalizeFollowerUserIds(followerIds);
  }"""

    if "private normalizeFollowerUserIds" not in source:
        if old_helper not in source:
            fail("Could not find exact getInAppFollowerUserIds helper block.")
        source = source.replace(old_helper, new_helper, 1)
        print("[wire_notifications_simple_follow_fallback] merged ProjectFollow + simple Follow follower lookup")
    else:
        print("[wire_notifications_simple_follow_fallback] merged follower lookup already present")

    required_after = [
        "@InjectModel('Follow')",
        "private readonly followModel?: Model<any>,",
        "private normalizeFollowerUserIds",
        "if (!Types.ObjectId.isValid(projectId))",
        "ProjectFollow follower lookup failed",
        "Simple Follow lookup failed",
        "this.followModel",
        "return this.normalizeFollowerUserIds(followerIds);",
        "async notifyFollowersShipUpdate(args:",
        "async notifyFollowersMilestoneReached(args:",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    # Safety: do not accidentally add event hooks that could duplicate direct notifications.
    forbidden = [
        "@OnEvent('project.ship.posted')",
        '@OnEvent("project.ship.posted")',
        "@OnEvent('project.milestone.reached')",
        '@OnEvent("project.milestone.reached")',
    ]

    for marker in forbidden:
        if marker in source and marker not in original:
            fail(f"Safety check failed: new duplicate-prone event hook was added: {marker}")

    if source == original:
        print("[wire_notifications_simple_follow_fallback] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-simple-follow-fallback-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_notifications_simple_follow_fallback] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_notifications_simple_follow_fallback] patched: {TARGET}")

    print("")
    print("[wire_notifications_simple_follow_fallback] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProjectFollow|InjectModel\\('Follow'\\)|followModel|normalizeFollowerUserIds|getInAppFollowerUserIds|notifyFollowersShipUpdate|notifyFollowersMilestoneReached|project.ship.posted|project.milestone.reached\" src/notifications/notifications.service.ts -C 8")
    print("  git diff -- src/notifications/notifications.service.ts")


if __name__ == "__main__":
    main()
