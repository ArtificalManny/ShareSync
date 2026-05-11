from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
lines = text.splitlines()

backup = path.with_suffix(
    path.suffix + f".bak-before-match-announcement-backdrop-to-create-project-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Locate the current Post Announcement backdrop button.
label = 'aria-label="Close post announcement modal backdrop"'
label_indexes = [i for i, line in enumerate(lines) if label in line]

if len(label_indexes) != 1:
    raise SystemExit(f"❌ Expected exactly one Post Announcement backdrop aria-label. Found {len(label_indexes)}. No changes written.")

label_idx = label_indexes[0]

# Walk upward to the start of the backdrop <button>.
button_start = None
for i in range(label_idx, max(-1, label_idx - 20), -1):
    if "<button" in lines[i]:
        button_start = i
        break

if button_start is None:
    raise SystemExit("❌ Could not find backdrop button start. No changes written.")

# Walk downward to the end of the self-closing backdrop button.
button_end = None
for i in range(label_idx, min(len(lines), label_idx + 20)):
    if "/>" in lines[i]:
        button_end = i
        break

if button_end is None:
    raise SystemExit("❌ Could not find backdrop button end. No changes written.")

# Find the modal panel that should come after the backdrop/decorative layers.
panel_start = None
for i in range(button_end + 1, min(len(lines), button_end + 80)):
    line = lines[i]
    if 'className="relative z-10 flex' in line or "className='relative z-10 flex" in line:
        panel_start = i
        break

if panel_start is None:
    raise SystemExit("❌ Could not find modal panel after backdrop. No changes written.")

new_backdrop = [
    '          <button',
    '            type="button"',
    '            className="absolute inset-0 z-0 cursor-default bg-slate-950/35 backdrop-blur-md transition-opacity"',
    '            onClick={() => setShowCreate(false)}',
    '            aria-label="Close post announcement modal backdrop"',
    '          />',
    '',
]

fixed_lines = lines[:button_start] + new_backdrop + lines[panel_start:]
fixed = "\n".join(fixed_lines) + "\n"

# Safety checks
if fixed.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if fixed.count('aria-label="Close post announcement modal backdrop"') != 1:
    raise SystemExit("❌ Safety check failed: backdrop aria-label count changed. No changes written.")

if fixed.count("Post Announcement") != 1:
    raise SystemExit("❌ Safety check failed: Post Announcement title count changed. No changes written.")

# Make sure the specific decorative glow layer we removed is no longer near the modal backdrop.
modal_slice_start = max(0, button_start - 20)
modal_slice_end = min(len(fixed_lines), button_start + 40)
modal_slice = "\n".join(fixed_lines[modal_slice_start:modal_slice_end])

if "radial-gradient(circle_at_50%_14%" in modal_slice:
    raise SystemExit("❌ Safety check failed: old ambient radial glow still exists near modal backdrop. No changes written.")

path.write_text(fixed)

print("✅ Post Announcement backdrop now matches Create New Project behavior more closely.")
print("✅ Removed decorative radial glow layers behind the modal.")
print("✅ Kept click-outside-to-close behavior.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '770,800p' src/components/views/AnnouncementsView.jsx")
