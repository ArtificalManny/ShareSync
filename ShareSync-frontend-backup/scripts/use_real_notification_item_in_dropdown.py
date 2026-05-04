from pathlib import Path
import re

path = Path("src/components/notifications/NotificationsDropdown.jsx")

if not path.exists():
    raise SystemExit(f"Missing file: {path}")

text = path.read_text()

# 1. Import the real external NotificationItem component under a non-conflicting name.
if "InviteNotificationItem" not in text:
    import_match = re.search(r"import React[\s\S]*?from ['\"]react['\"];?", text)

    if not import_match:
        raise SystemExit("Could not find React import anchor in NotificationsDropdown.jsx.")

    insert_at = import_match.end()
    text = (
        text[:insert_at]
        + '\nimport InviteNotificationItem from "./NotificationItem.jsx";'
        + text[insert_at:]
    )

# 2. Replace the rendered local NotificationItem with the external one.
old = """              <NotificationItem
                key={notification._id || notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onRemove={removeNotification}
                onClick={handleNotificationClick}
              />"""

new = """              <InviteNotificationItem
                key={notification._id || notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onRemove={removeNotification}
                onClick={handleNotificationClick}
              />"""

if old not in text:
    raise SystemExit("Could not find notification map render block in NotificationsDropdown.jsx.")

text = text.replace(old, new, 1)

path.write_text(text)

print("NotificationsDropdown now renders external NotificationItem.jsx.")
