from pathlib import Path
import re
from datetime import datetime

TARGET = Path("src/components/notifications/NotificationsDropdown.jsx")

OLD_PATTERN = re.compile(
    r"""  const handleNotificationClick = useCallback\(\(notification\) => \{
    // Navigate based on notification data
    const data = notification\.data \|\| \{\};

    if \(data\.projectId && data\.taskId\) \{
      navigate\(`/projects/\$\{data\.projectId\}/tasks/\$\{data\.taskId\}`\);
    \} else if \(data\.projectId\) \{
      navigate\(`/projects/\$\{data\.projectId\}`\);
    \} else if \(data\.conversationId\) \{
      navigate\(`/messages/\$\{data\.conversationId\}`\);
    \}

    onClose\(\);
  \}, \[navigate, onClose\]\);""",
    re.MULTILINE,
)

NEW_BLOCK = """  // NOTIFICATION ROUTE SAFETY BRIDGE
  // XP/global notifications should never fall back to "/" because "/" renders Landing.jsx.
  // If a notification has no real destination, we keep the user in-app and close the dropdown.
  const resolveNotificationRoute = useCallback((notification) => {
    const data = notification?.data || {};
    const meta = notification?.meta || {};
    const type = String(notification?.type || "").toLowerCase();
    const title = String(notification?.title || "").toLowerCase();

    const projectId =
      data.projectId ||
      data.project ||
      meta.projectId ||
      meta.project ||
      notification?.projectId;

    const taskId =
      data.taskId ||
      data.task ||
      meta.taskId ||
      meta.task ||
      notification?.taskId;

    const conversationId =
      data.conversationId ||
      data.conversation ||
      meta.conversationId ||
      meta.conversation ||
      notification?.conversationId;

    const rawActionUrl =
      data.actionUrl ||
      data.targetUrl ||
      data.link ||
      data.url ||
      meta.actionUrl ||
      meta.targetUrl ||
      meta.link ||
      meta.url ||
      notification?.actionUrl ||
      notification?.targetUrl ||
      notification?.link ||
      notification?.url;

    const isXpNotification =
      type.includes("xp") ||
      type.includes("experience") ||
      title.includes("xp earned") ||
      title.includes("xp");

    if (projectId && taskId) {
      return `/projects/${projectId}/tasks/${taskId}`;
    }

    if (projectId) {
      return `/projects/${projectId}`;
    }

    if (conversationId) {
      return `/messages/${conversationId}`;
    }

    // XP is a global/home-level event. Send it to Home, never Landing.
    if (isXpNotification) {
      return "/home";
    }

    // Respect explicit internal links, but block "/" because that is Landing.jsx.
    if (typeof rawActionUrl === "string") {
      const trimmedUrl = rawActionUrl.trim();

      if (trimmedUrl && trimmedUrl !== "/" && trimmedUrl.startsWith("/") && !trimmedUrl.startsWith("//")) {
        return trimmedUrl;
      }
    }

    return null;
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    const route = resolveNotificationRoute(notification);

    if (route) {
      navigate(route);
    }

    onClose();
  }, [navigate, onClose, resolveNotificationRoute]);"""

def main():
    print("[fix_xp_notification_landing_redirect] starting")

    if not TARGET.exists():
      raise SystemExit(f"[fix_xp_notification_landing_redirect] ERROR: missing {TARGET}")

    text = TARGET.read_text()

    matches = OLD_PATTERN.findall(text)
    if len(matches) != 1:
        raise SystemExit(
            f"[fix_xp_notification_landing_redirect] ERROR: expected 1 handleNotificationClick block, found {len(matches)}"
        )

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-xp-notification-route-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)

    updated = OLD_PATTERN.sub(NEW_BLOCK, text, count=1)
    TARGET.write_text(updated)

    print(f"[fix_xp_notification_landing_redirect] backup created: {backup}")
    print("[fix_xp_notification_landing_redirect] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "NOTIFICATION ROUTE SAFETY BRIDGE|resolveNotificationRoute|XP is a global|Landing.jsx|handleNotificationClick|navigate\\(" src/components/notifications/NotificationsDropdown.jsx -C 8')
    print("  git diff -- src/components/notifications/NotificationsDropdown.jsx")

if __name__ == "__main__":
    main()
