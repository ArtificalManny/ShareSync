from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-match-project-modal-backdrop-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = '''          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default bg-slate-100/70 backdrop-blur-2xl transition-opacity"
            style={{
              WebkitBackdropFilter: 'blur(26px) saturate(0.45)',
              backdropFilter: 'blur(26px) saturate(0.45)',
            }}
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />'''

new = '''          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default transition-opacity"
            style={{
              backgroundColor: 'rgba(226, 232, 240, 0.84)',
              WebkitBackdropFilter: 'blur(18px) grayscale(1) saturate(0.08)',
              backdropFilter: 'blur(18px) grayscale(1) saturate(0.08)',
            }}
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />'''

if old not in text:
    raise SystemExit("❌ Could not find the current milky backdrop block. No changes written.")

fixed = text.replace(old, new, 1)

# Safety checks
if fixed.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if fixed.count('aria-label="Close post announcement modal backdrop"') != 1:
    raise SystemExit("❌ Safety check failed: backdrop aria-label count changed. No changes written.")

if "backgroundColor: 'rgba(226, 232, 240, 0.84)'" not in fixed:
    raise SystemExit("❌ Safety check failed: neutral matte background missing. No changes written.")

if "grayscale(1) saturate(0.08)" not in fixed:
    raise SystemExit("❌ Safety check failed: grayscale/desaturation missing. No changes written.")

path.write_text(fixed)

print("✅ Post Announcement backdrop now uses a neutral matte glass overlay.")
print("✅ Purple/pink bleed-through should be heavily reduced.")
print("✅ Click-outside-to-close preserved.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '786,804p' src/components/views/AnnouncementsView.jsx")
