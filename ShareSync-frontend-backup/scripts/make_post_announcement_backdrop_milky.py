from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-milky-post-announcement-backdrop-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = '''          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default bg-slate-950/45 backdrop-blur-xl backdrop-saturate-50 transition-opacity"
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />'''

new = '''          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default bg-slate-100/70 backdrop-blur-2xl transition-opacity"
            style={{
              WebkitBackdropFilter: 'blur(26px) saturate(0.45)',
              backdropFilter: 'blur(26px) saturate(0.45)',
            }}
            onClick={() => setShowCreate(false)}
            aria-label="Close post announcement modal backdrop"
          />'''

if old not in text:
    raise SystemExit("❌ Could not find the exact current backdrop block. No changes written.")

text = text.replace(old, new, 1)

# Safety checks
if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if text.count('aria-label="Close post announcement modal backdrop"') != 1:
    raise SystemExit("❌ Safety check failed: backdrop aria-label count changed. No changes written.")

if text.count("WebkitBackdropFilter: 'blur(26px) saturate(0.45)'") != 1:
    raise SystemExit("❌ Safety check failed: WebKit backdrop style missing. No changes written.")

if text.count("bg-slate-100/70 backdrop-blur-2xl") != 1:
    raise SystemExit("❌ Safety check failed: milky backdrop class missing. No changes written.")

path.write_text(text)

print("✅ Post Announcement backdrop changed to milky neutral glass.")
print("✅ Purple/pink bleed-through should now be much calmer.")
print("✅ Click-outside-to-close preserved.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '786,802p' src/components/views/AnnouncementsView.jsx")
