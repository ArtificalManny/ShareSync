from pathlib import Path
from datetime import datetime

path = Path("src/components/navigation/NotificationCenter.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/navigation/NotificationCenter.jsx")

text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-navbar-notification-bell-override-{stamp}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = """export default function NotificationCenter() {
  return <NotificationsBell />;
}
"""

new = """export default function NotificationCenter() {
  return (
    <div className="openshare-navbar-notification-center">
      <NotificationsBell />

      <style>{`
        .openshare-navbar-notification-center > button,
        .openshare-navbar-notification-center > div > button,
        .openshare-navbar-notification-center button[aria-label*="Notification" i],
        .openshare-navbar-notification-center button[title*="Notification" i] {
          color: #334155 !important;
        }

        .openshare-navbar-notification-center > button:hover,
        .openshare-navbar-notification-center > div > button:hover,
        .openshare-navbar-notification-center button[aria-label*="Notification" i]:hover,
        .openshare-navbar-notification-center button[title*="Notification" i]:hover {
          color: #6d28d9 !important;
        }

        .dark .openshare-navbar-notification-center > button,
        .dark .openshare-navbar-notification-center > div > button,
        .dark .openshare-navbar-notification-center button[aria-label*="Notification" i],
        .dark .openshare-navbar-notification-center button[title*="Notification" i] {
          color: #d4d4d8 !important;
        }

        .dark .openshare-navbar-notification-center > button:hover,
        .dark .openshare-navbar-notification-center > div > button:hover,
        .dark .openshare-navbar-notification-center button[aria-label*="Notification" i]:hover,
        .dark .openshare-navbar-notification-center button[title*="Notification" i]:hover {
          color: #c4b5fd !important;
        }

        .openshare-navbar-notification-center svg {
          stroke-width: 2.25;
        }
      `}</style>
    </div>
  );
}
"""

if old not in text:
    raise SystemExit("❌ Could not find the simple NotificationCenter delegate block. No changes written.")

text = text.replace(old, new, 1)
path.write_text(text)

print("✅ NotificationCenter now applies a scoped darker Navbar bell override.")
print("")
print("Inspect:")
print("sed -n '1,45p' src/components/navigation/NotificationCenter.jsx")
