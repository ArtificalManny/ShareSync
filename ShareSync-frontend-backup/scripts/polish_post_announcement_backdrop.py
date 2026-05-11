from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-polish-post-announcement-backdrop-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Make the overlay container more deliberate and responsive.
old_outer = '        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">'
new_outer = '        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 sm:p-6">'

if old_outer not in text:
    raise SystemExit("❌ Could not find modal overlay outer wrapper. No changes written.")

text = text.replace(old_outer, new_outer, 1)

# 2) Replace the flat/hovering dark backdrop with a stable premium blur.
old_backdrop = '''          <button
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-md transition-opacity hover:bg-slate-950/50"
            onClick={() => setShowCreate(false)}
            aria-label="Close"
          />'''

new_backdrop = '''          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default bg-slate-950/45 backdrop-blur-[10px] transition-opacity"
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />

          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_14%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(236,72,153,0.16),transparent_30%),radial-gradient(circle_at_12%_72%,rgba(20,184,166,0.12),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-white/20 to-transparent" />'''

if old_backdrop not in text:
    raise SystemExit("❌ Could not find existing backdrop button block. No changes written.")

text = text.replace(old_backdrop, new_backdrop, 1)

# 3) Lift the modal above the decorative backdrop and make the shadow cleaner.
old_panel = '          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-950/30">'
new_panel = '          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.34)] ring-1 ring-white/60">'

if old_panel not in text:
    raise SystemExit("❌ Could not find modal panel class. No changes written.")

text = text.replace(old_panel, new_panel, 1)

# Safety checks
if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if text.count("Close post announcement modal backdrop") != 1:
    raise SystemExit("❌ Safety check failed: backdrop aria-label missing or duplicated. No changes written.")

if text.count("Post Announcement") != 1:
    raise SystemExit("❌ Safety check failed: Post Announcement title count changed. No changes written.")

path.write_text(text)

print("✅ Post Announcement backdrop polished.")
print("✅ Backdrop now has premium blur + subtle OpenShare ambient glow.")
print("✅ Click-outside-to-close behavior preserved.")
print("✅ Modal panel lifted above backdrop with cleaner shadow.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '786,806p' src/components/views/AnnouncementsView.jsx")
