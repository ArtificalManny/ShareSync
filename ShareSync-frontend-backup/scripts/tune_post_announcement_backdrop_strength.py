from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-tune-post-announcement-backdrop-strength-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = 'className="absolute inset-0 z-0 cursor-default bg-slate-950/35 backdrop-blur-md transition-opacity"'

new = 'className="absolute inset-0 z-0 cursor-default bg-slate-950/45 backdrop-blur-xl backdrop-saturate-50 transition-opacity"'

if old not in text:
    raise SystemExit("❌ Could not find the exact current Post Announcement backdrop class. No changes written.")

text = text.replace(old, new, 1)

# Safety checks
if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if text.count('aria-label="Close post announcement modal backdrop"') != 1:
    raise SystemExit("❌ Safety check failed: backdrop aria-label count changed. No changes written.")

if text.count("bg-slate-950/45 backdrop-blur-xl backdrop-saturate-50") != 1:
    raise SystemExit("❌ Safety check failed: new backdrop class missing. No changes written.")

if text.count("Post Announcement") != 1:
    raise SystemExit("❌ Safety check failed: Post Announcement title count changed. No changes written.")

path.write_text(text)

print("✅ Post Announcement backdrop strength tuned.")
print("✅ Background is now darker, blurrier, and less color-saturated.")
print("✅ This should make it behave closer to Create New Project.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '786,800p' src/components/views/AnnouncementsView.jsx")
