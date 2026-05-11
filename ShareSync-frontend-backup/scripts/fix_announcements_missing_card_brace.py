from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-main-export-nesting-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

main_marker = "// ─── Main Component"
export_marker = "export default function AnnouncementsView"

if main_marker not in text:
    raise SystemExit("❌ Could not find Main Component marker. No changes written.")

if export_marker not in text:
    raise SystemExit("❌ Could not find AnnouncementsView export. No changes written.")

main_index = text.find(main_marker)
export_index = text.find(export_marker)

if export_index < main_index:
    raise SystemExit("❌ Export appears before Main Component marker. No changes written.")

before_main = text[:main_index]
after_main = text[main_index:]

# The parser says the export is nested. The safest surgical fix is to close
# the preceding helper function immediately before the Main Component section.
# This mirrors the previous YourMovesToday.jsx fix pattern.
insert = "\n}\n\n"

# Avoid inserting repeatedly if already fixed.
tail = before_main[-20:]

if tail.rstrip().endswith("}"):
    print("ℹ️ Text before Main Component already ends with a closing brace.")
    print("No automatic brace inserted.")
else:
    text = before_main.rstrip() + insert + after_main.lstrip()
    print("✅ Inserted one missing closing brace before Main Component.")

# Safety checks
if text.count(export_marker) != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count is not exactly 1. No changes written.")

if "function AttachmentGallery" not in text:
    raise SystemExit("❌ Safety check failed: missing AttachmentGallery. No changes written.")

if "function AnnouncementCard" not in text:
    raise SystemExit("❌ Safety check failed: missing AnnouncementCard. No changes written.")

if "function CommentSection" not in text:
    raise SystemExit("❌ Safety check failed: missing CommentSection. No changes written.")

if "function AttachmentInput" not in text:
    raise SystemExit("❌ Safety check failed: missing AttachmentInput. No changes written.")

if "\n}) {\n" in text:
    raise SystemExit("❌ Safety check failed: malformed `}) {` still exists. No changes written.")

if text == original:
    print("ℹ️ No file changes were made.")
else:
    path.write_text(text)
    print("✅ AnnouncementsView.jsx main export is no longer nested.")
    print("✅ Backend untouched.")
    print("✅ Visual refinements preserved.")

