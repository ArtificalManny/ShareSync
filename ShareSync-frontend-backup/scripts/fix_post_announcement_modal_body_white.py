from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-post-announcement-body-white-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old_panel = '''          <div className="pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 backdrop-blur-sm shadow-[0_24px_80px_rgba(139,92,246,0.16)]">'''

new_panel = '''          <div className="pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(139,92,246,0.16)]">'''

if old_panel not in text:
    raise SystemExit("❌ Could not find current pc-create-modal panel class. No changes written.")

text = text.replace(old_panel, new_panel, 1)

old_body = '''            <div className="space-y-6 overflow-y-auto p-8">'''

new_body = '''            <div className="flex-1 space-y-6 overflow-y-auto bg-white px-8 py-8">'''

if old_body not in text:
    raise SystemExit("❌ Could not find modal body wrapper `space-y-6 overflow-y-auto p-8`. No changes written.")

text = text.replace(old_body, new_body, 1)

# Patch invalid/over-transparent footer background if present.
text = text.replace("bg-slate-50/88", "bg-slate-50")

# Safety checks
if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if text.count("pc-create-modal pointer-events-auto relative w-full max-w-2xl") != 1:
    raise SystemExit("❌ Safety check failed: modal shell count is not exactly 1. No changes written.")

if "bg-white/96 backdrop-blur-sm" in text:
    raise SystemExit("❌ Safety check failed: transparent modal shell still exists. No changes written.")

if "flex-1 space-y-6 overflow-y-auto bg-white px-8 py-8" not in text:
    raise SystemExit("❌ Safety check failed: white modal body missing. No changes written.")

path.write_text(text)

print("✅ Post Announcement modal body fixed.")
print("✅ Modal panel is now solid white, not transparent.")
print("✅ Scrollable body now has explicit bg-white.")
print("✅ Footer transparency cleaned if present.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '786,845p' src/components/views/AnnouncementsView.jsx")
