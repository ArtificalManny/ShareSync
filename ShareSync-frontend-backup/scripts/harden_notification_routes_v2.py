from pathlib import Path
from datetime import datetime

DROPDOWN = Path("src/components/notifications/NotificationsDropdown.jsx")
API = Path("src/api/notifications.js")


def backup(path: Path, label: str) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak.{label}-{stamp}")
    backup_path.write_text(path.read_text())
    return backup_path


def patch_dropdown():
    print("[patch] NotificationsDropdown.jsx")

    if not DROPDOWN.exists():
        raise SystemExit(f"[ERROR] Missing file: {DROPDOWN}")

    text = DROPDOWN.read_text()
    backup_path = backup(DROPDOWN, "before-notification-route-hardening-v2")

    # Let the click handler receive the actual click event so it can block any accidental browser fallback.
    if "const handleClick = () => {" in text:
        text = text.replace(
            "const handleClick = () => {",
            "const handleClick = (event) => {",
            1,
        )

    if "onClick?.(notification);" in text:
        text = text.replace(
            "onClick?.(notification);",
            "onClick?.(notification, event);",
            1,
        )

    start_marker_options = [
        "  // NOTIFICATION ROUTE SAFETY BRIDGE",
        "  const handleNotificationClick = useCallback((notification)",
    ]

    start = -1
    for marker in start_marker_options:
        start = text.find(marker)
        if start != -1:
            break

    if start == -1:
        raise SystemExit("[ERROR] Could not find notification click handler start marker")

    end_marker = "  const handleScroll = useCallback"
    end = text.find(end_marker, start)

    if end == -1:
        raise SystemExit("[ERROR] Could not find handleScroll marker after notification click handler")

    new_block = """  // NOTIFICATION ROUTE SAFETY BRIDGE V2
  // Important:
  // - "/" renders Landing.jsx in this app shell.
  // - XP/global notifications should route to /home, not /.
  // - Unknown notifications should close the dropdown without navigating.
  const safeObject = useCallback((value) => {
    if (!value) return {};

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    return typeof value === "object" ? value : {};
  }, []);

  const resolveNotificationRoute = useCallback((notification) => {
    const data = safeObject(notification?.data);
    const meta = safeObject(notification?.meta);

    const type = String(notification?.type || "").toLowerCase();
    const title = String(notification?.title || "").toLowerCase();
    const body = String(notification?.body || notification?.message || "").toLowerCase();

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
      title.includes("xp") ||
      body.includes("xp for completing");

    if (projectId && taskId) {
      return `/projects/${projectId}/tasks/${taskId}`;
    }

    if (projectId) {
      return `/projects/${projectId}`;
    }

    if (conversationId) {
      return `/messages/${conversationId}`;
    }

    if (isXpNotification) {
      return "/home";
    }

    if (typeof rawActionUrl === "string") {
      const trimmedUrl = rawActionUrl.trim();

      // Never allow notification clicks to route to Landing.jsx.
      if (trimmedUrl === "/" || trimmedUrl === "") {
        return null;
      }

      // Only allow safe internal routes.
      if (trimmedUrl.startsWith("/") && !trimmedUrl.startsWith("//")) {
        return trimmedUrl;
      }
    }

    return null;
  }, [safeObject]);

  const handleNotificationClick = useCallback((notification, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const route = resolveNotificationRoute(notification);

    if (route) {
      navigate(route);
    }

    onClose();
  }, [navigate, onClose, resolveNotificationRoute]);

"""

    text = text[:start] + new_block + text[end:]

    DROPDOWN.write_text(text)
    print(f"[backup] {backup_path}")
    print("[patched] NotificationsDropdown.jsx route safety bridge v2")


def patch_api():
    print("[patch] api/notifications.js")

    if not API.exists():
        raise SystemExit(f"[ERROR] Missing file: {API}")

    text = API.read_text()
    backup_path = backup(API, "before-notification-api-normalize-v2")

    helper = """
// NOTIFICATION DESTINATION NORMALIZATION BRIDGE
// Protects the UI from backend notifications that accidentally carry "/" as a target.
// "/" renders Landing.jsx, so XP/global notifications should resolve to "/home" instead.
function safeNotificationObject(value) {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" ? value : {};
}

function isXpNotification(notification) {
  const type = String(notification?.type || "").toLowerCase();
  const title = String(notification?.title || "").toLowerCase();
  const body = String(notification?.body || notification?.message || "").toLowerCase();

  return (
    type.includes("xp") ||
    type.includes("experience") ||
    title.includes("xp earned") ||
    title.includes("xp") ||
    body.includes("xp for completing")
  );
}

function normalizeNotificationDestination(notification) {
  if (!notification || typeof notification !== "object") {
    return notification;
  }

  const next = { ...notification };
  const data = safeNotificationObject(next.data);
  const meta = safeNotificationObject(next.meta);

  if (isXpNotification(next)) {
    next.actionUrl = "/home";
    next.targetUrl = "/home";
    next.link = "/home";
    next.url = "/home";
    next.data = {
      ...data,
      actionUrl: "/home",
      targetUrl: "/home",
    };
    next.meta = meta;
    return next;
  }

  const rootTargets = [next.actionUrl, next.targetUrl, next.link, next.url];

  if (rootTargets.some((value) => typeof value === "string" && value.trim() === "/")) {
    next.actionUrl = null;
    next.targetUrl = null;
    next.link = null;
    next.url = null;
  }

  return next;
}

function normalizeNotificationsPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeNotificationDestination);
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload.notifications)) {
    return {
      ...payload,
      notifications: payload.notifications.map(normalizeNotificationDestination),
    };
  }

  if (Array.isArray(payload.items)) {
    return {
      ...payload,
      items: payload.items.map(normalizeNotificationDestination),
    };
  }

  return normalizeNotificationDestination(payload);
}

"""

    if "NOTIFICATION DESTINATION NORMALIZATION BRIDGE" not in text:
        import_line = "import api from './client';\n"
        if import_line not in text:
            raise SystemExit("[ERROR] Could not find api import line in src/api/notifications.js")

        text = text.replace(import_line, import_line + helper, 1)
        print("[patched] inserted notification normalization helpers")
    else:
        print("[skip] normalization helpers already present")

    old_return = "return response.data?.data || response.data;"
    new_return = "return normalizeNotificationsPayload(response.data?.data || response.data);"

    if new_return not in text:
        if old_return not in text:
            raise SystemExit("[ERROR] Could not find fetchNotifications return line")
        text = text.replace(old_return, new_return, 1)
        print("[patched] fetchNotifications normalizes payload")
    else:
        print("[skip] fetchNotifications already normalizes payload")

    API.write_text(text)
    print(f"[backup] {backup_path}")


def main():
    print("[harden_notification_routes_v2] starting")
    patch_dropdown()
    patch_api()

    print()
    print("[harden_notification_routes_v2] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "NOTIFICATION ROUTE SAFETY BRIDGE V2|resolveNotificationRoute|event\\?\\.preventDefault|onClick\\?\\.\\(notification, event\\)" src/components/notifications/NotificationsDropdown.jsx -C 8')
    print('  rg -n "NOTIFICATION DESTINATION NORMALIZATION BRIDGE|normalizeNotificationsPayload|normalizeNotificationDestination|isXpNotification|actionUrl: \\"/home\\"" src/api/notifications.js -C 8')
    print("  git diff -- src/components/notifications/NotificationsDropdown.jsx src/api/notifications.js")


if __name__ == "__main__":
    main()
