#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/notifications/email.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_email_service_follower_updates] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[harden_email_service_follower_updates] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class EmailService",
        "async sendNotification(user: UserLike, notification: any): Promise<void>",
        "private isEmailAllowed(user: UserLike): boolean",
        "private buildEmailTemplate(notification: any): string",
        "private getEmojiForType(type: string): string",
        "follow_created: '⭐',",
        "text: notification?.message || '',",
        "const msg = this.escapeHtml(notification?.message || '');",
        "const actionUrl = notification?.actionData?.url ? String(notification.actionData.url) : '';",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Let plain-text emails fall back to notification.body.
    old_text = "        text: notification?.message || '',"
    new_text = "        text: notification?.message || notification?.body || '',"

    if new_text not in source:
        source = source.replace(old_text, new_text, 1)
        print("[harden_email_service_follower_updates] added body fallback for email text")
    else:
        print("[harden_email_service_follower_updates] email text fallback already present")

    # 2) Add helper for converting relative app URLs into absolute frontend URLs.
    old_is_email_allowed_end = """    return verified && optIn && channelOk;
  }

  private buildEmailTemplate(notification: any): string {"""

    new_is_email_allowed_end = """    return verified && optIn && channelOk;
  }

  private buildFrontendUrl(rawUrl?: string): string {
    const url = String(rawUrl || '').trim();
    if (!url) return '';

    if (/^https?:\\/\\//i.test(url)) {
      return url;
    }

    const frontendBase = String(process.env.FRONTEND_URL || '').replace(/\\/+$/, '');

    if (!frontendBase) {
      return url;
    }

    return url.startsWith('/')
      ? `${frontendBase}${url}`
      : `${frontendBase}/${url}`;
  }

  private buildEmailTemplate(notification: any): string {"""

    if "private buildFrontendUrl(rawUrl?: string): string" not in source:
        source = source.replace(old_is_email_allowed_end, new_is_email_allowed_end, 1)
        print("[harden_email_service_follower_updates] added frontend URL helper")
    else:
        print("[harden_email_service_follower_updates] frontend URL helper already present")

    # 3) Let HTML emails fall back to notification.body.
    old_msg = "    const msg = this.escapeHtml(notification?.message || '');"
    new_msg = "    const msg = this.escapeHtml(notification?.message || notification?.body || '');"

    if new_msg not in source:
        source = source.replace(old_msg, new_msg, 1)
        print("[harden_email_service_follower_updates] added body fallback for email template")
    else:
        print("[harden_email_service_follower_updates] email template fallback already present")

    # 4) Convert action URL to absolute frontend URL when possible.
    old_action = "    const actionUrl = notification?.actionData?.url ? String(notification.actionData.url) : '';"
    new_action = "    const actionUrl = this.buildFrontendUrl(notification?.actionData?.url);"

    if new_action not in source:
        source = source.replace(old_action, new_action, 1)
        print("[harden_email_service_follower_updates] normalized email action URLs")
    else:
        print("[harden_email_service_follower_updates] email action URLs already normalized")

    # 5) Add follower/public-loop emojis.
    old_emoji_tail = """      project_invite: '👋',
      comment_added: '💬',
      follow_created: '⭐',
    };"""

    new_emoji_tail = """      project_invite: '👋',
      comment_added: '💬',
      follow_created: '⭐',
      project_ship_update: '🚀',
      project_milestone_reached: '🏁',
    };"""

    if "project_ship_update: '🚀'," not in source:
        source = source.replace(old_emoji_tail, new_emoji_tail, 1)
        print("[harden_email_service_follower_updates] added follower update email emojis")
    else:
        print("[harden_email_service_follower_updates] follower update email emojis already present")

    required_after = [
        "text: notification?.message || notification?.body || '',",
        "private buildFrontendUrl(rawUrl?: string): string",
        "const frontendBase = String(process.env.FRONTEND_URL || '').replace(/\\/+$/, '');",
        "const msg = this.escapeHtml(notification?.message || notification?.body || '');",
        "const actionUrl = this.buildFrontendUrl(notification?.actionData?.url);",
        "project_ship_update: '🚀',",
        "project_milestone_reached: '🏁',",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[harden_email_service_follower_updates] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-follower-email-updates-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_email_service_follower_updates] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[harden_email_service_follower_updates] patched: {TARGET}")

    print("")
    print("[harden_email_service_follower_updates] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"buildFrontendUrl|project_ship_update|project_milestone_reached|notification\\?\\.body|FRONTEND_URL|actionUrl\" src/notifications/email.service.ts -C 8")
    print("  git diff -- src/notifications/email.service.ts")


if __name__ == "__main__":
    main()
