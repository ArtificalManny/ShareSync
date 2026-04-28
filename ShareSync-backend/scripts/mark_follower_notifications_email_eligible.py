#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/notifications/notifications.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[mark_follower_notifications_email_eligible] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[mark_follower_notifications_email_eligible] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "async notifyFollowersShipUpdate(args:",
        "async notifyFollowersMilestoneReached(args:",
        "type: NotificationType.PROJECT_SHIP_UPDATE,",
        "type: NotificationType.PROJECT_MILESTONE_REACHED,",
        "actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],",
        "groupKey: `follow-ship-${userId}-${args.projectId}-${new Date().toDateString()}`,",
        "groupKey: `follow-mile-${userId}-${args.projectId}-${new Date().toDateString()}`,",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # Patch ship-update follower notification data.
    old_ship_data = """      data: {
        projectId: args.projectId,
        projectName: args.projectName,
        shipTitle: args.shipTitle,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],"""

    new_ship_data = """      data: {
        projectId: args.projectId,
        projectName: args.projectName,
        shipTitle: args.shipTitle,
        emailFanoutEligible: true,
        followerNotification: true,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],"""

    if "emailFanoutEligible: true" not in source.split("async notifyFollowersShipUpdate", 1)[1].split("async notifyFollowersMilestoneReached", 1)[0]:
        if old_ship_data not in source:
            fail("Could not find ship-update follower notification data block.")
        source = source.replace(old_ship_data, new_ship_data, 1)
        print("[mark_follower_notifications_email_eligible] marked ship updates email eligible")
    else:
        print("[mark_follower_notifications_email_eligible] ship updates already marked email eligible")

    # Patch milestone follower notification data.
    old_milestone_data = """      data: {
        projectId: args.projectId,
        projectName: args.projectName,
        milestoneName: args.milestoneName,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],"""

    new_milestone_data = """      data: {
        projectId: args.projectId,
        projectName: args.projectName,
        milestoneName: args.milestoneName,
        emailFanoutEligible: true,
        followerNotification: true,
      },
      actions: [{ label: 'View Project', url: `/projects/${args.projectId}` }],"""

    if "emailFanoutEligible: true" not in source.split("async notifyFollowersMilestoneReached", 1)[1].split("// ─────────────────────────────────────────────────────────────────────────────\n  // READ", 1)[0]:
        if old_milestone_data not in source:
            fail("Could not find milestone follower notification data block.")
        source = source.replace(old_milestone_data, new_milestone_data, 1)
        print("[mark_follower_notifications_email_eligible] marked milestones email eligible")
    else:
        print("[mark_follower_notifications_email_eligible] milestones already marked email eligible")

    # Patch email fan-out comment and gate so follower public-loop emails are explicit.
    old_email_comment = """    // ── EMAIL ──────────────────────────────────────────────────────────────
    // Send email for all notification types IF user has email enabled
    if (this.emailService) {"""

    new_email_comment = """    // ── EMAIL ──────────────────────────────────────────────────────────────
    // Send email only when EmailService + user preferences allow it.
    // Follower public-loop notifications are explicitly marked through
    // data.emailFanoutEligible so this path is intentional and auditable.
    const isFollowerEmailEligible =
      notification.type === NotificationType.PROJECT_SHIP_UPDATE ||
      notification.type === NotificationType.PROJECT_MILESTONE_REACHED ||
      (notification as any)?.data?.emailFanoutEligible === true;

    if (this.emailService && (isFollowerEmailEligible || notification.priority === NotificationPriority.HIGH || notification.priority === NotificationPriority.URGENT)) {"""

    if "const isFollowerEmailEligible =" not in source:
        if old_email_comment not in source:
            fail("Could not find email fan-out comment/gate block.")
        source = source.replace(old_email_comment, new_email_comment, 1)
        print("[mark_follower_notifications_email_eligible] added explicit email fan-out eligibility gate")
    else:
        print("[mark_follower_notifications_email_eligible] email fan-out eligibility gate already present")

    required_after = [
        "emailFanoutEligible: true,",
        "followerNotification: true,",
        "const isFollowerEmailEligible =",
        "NotificationType.PROJECT_SHIP_UPDATE",
        "NotificationType.PROJECT_MILESTONE_REACHED",
        "this.emailService && (isFollowerEmailEligible || notification.priority === NotificationPriority.HIGH || notification.priority === NotificationPriority.URGENT)",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[mark_follower_notifications_email_eligible] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-follower-email-eligible-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[mark_follower_notifications_email_eligible] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[mark_follower_notifications_email_eligible] patched: {TARGET}")

    print("")
    print("[mark_follower_notifications_email_eligible] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"emailFanoutEligible|followerNotification|isFollowerEmailEligible|PROJECT_SHIP_UPDATE|PROJECT_MILESTONE_REACHED|fanOutToChannels|emailService\" src/notifications/notifications.service.ts -C 8")
    print("  git diff -- src/notifications/notifications.service.ts")


if __name__ == "__main__":
    main()
