from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-match-post-announcement-shell-to-project-create-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

replacements = [
    (
        '''        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 sm:p-6">''',
        '''        <div className="pc-create-viewport fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">'''
    ),
    (
        '''          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default transition-opacity"
            style={{
              backgroundColor: 'rgba(226, 232, 240, 0.84)',
              WebkitBackdropFilter: 'blur(18px) grayscale(1) saturate(0.08)',
              backdropFilter: 'blur(18px) grayscale(1) saturate(0.08)',
            }}
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />''',
        '''          <button
            type="button"
            className="pc-create-backdrop fixed inset-0 bg-black/5 backdrop-blur-[2px] pointer-events-auto"
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />'''
    ),
    (
        '''          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.34)] ring-1 ring-white/60">''',
        '''          <div className="pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 backdrop-blur-sm shadow-[0_24px_80px_rgba(139,92,246,0.16)]">'''
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f"❌ Could not find expected block. No changes written. Missing block starts with:\n{old[:180]}")
    text = text.replace(old, new, 1)

# Safety checks
if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if text.count("pc-create-backdrop fixed inset-0 bg-black/5 backdrop-blur-[2px]") != 1:
    raise SystemExit("❌ Safety check failed: project-create backdrop class missing. No changes written.")

if text.count("pc-create-viewport fixed inset-0 z-[9999]") != 1:
    raise SystemExit("❌ Safety check failed: project-create viewport class missing. No changes written.")

if text.count("pc-create-modal pointer-events-auto relative w-full max-w-2xl") != 1:
    raise SystemExit("❌ Safety check failed: project-create modal shell class missing. No changes written.")

if "backgroundColor: 'rgba(226, 232, 240, 0.84)'" in text:
    raise SystemExit("❌ Safety check failed: old inline matte backdrop still exists. No changes written.")

path.write_text(text)

print("✅ Post Announcement modal shell now matches Create New Project shell.")
print("✅ Backdrop now uses pc-create-backdrop bg-black/5 backdrop-blur-[2px].")
print("✅ Viewport now uses pointer-events-none like Create New Project.")
print("✅ Modal panel now uses pc-create-modal shell styling.")
print("✅ Click-outside-to-close preserved.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '786,806p' src/components/views/AnnouncementsView.jsx")
