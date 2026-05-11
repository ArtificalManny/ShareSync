from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-duplicate-tails-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

original = text

# ─────────────────────────────────────────────────────────────────────────────
# Fix 1:
# Remove leftover old AttachmentGallery anonymous tail:
#
# }) {
#   const urls = Array.isArray(attachments)
# ...
# function AttachmentInput(...)
# ─────────────────────────────────────────────────────────────────────────────

gallery_start = "\n}) {\n  const urls = Array.isArray(attachments)"
gallery_end = "\nfunction AttachmentInput("

if gallery_start in text:
    start = text.find(gallery_start)
    end = text.find(gallery_end, start)

    if end == -1:
        raise SystemExit("❌ Found AttachmentGallery leftover tail, but could not find function AttachmentInput. No changes written.")

    removed = text[start:end]
    if "function AttachmentInput" in removed or "function CommentSection" in removed:
        raise SystemExit("❌ Safety check failed while removing AttachmentGallery tail. No changes written.")

    text = text[:start] + text[end:]
    print("✅ Removed leftover old AttachmentGallery tail.")
else:
    print("ℹ️ No leftover AttachmentGallery tail found.")

# ─────────────────────────────────────────────────────────────────────────────
# Fix 2:
# Remove leftover old AnnouncementCard anonymous tail:
#
# }) {
#   const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
# ...
# // ─── Main Component
# ─────────────────────────────────────────────────────────────────────────────

card_start = "\n}) {\n  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;"
card_end = "\n// ─── Main Component"

if card_start in text:
    start = text.find(card_start)
    end = text.find(card_end, start)

    if end == -1:
        raise SystemExit("❌ Found AnnouncementCard leftover tail, but could not find Main Component marker. No changes written.")

    removed = text[start:end]
    if "export default function AnnouncementsView" in removed:
        raise SystemExit("❌ Safety check failed while removing AnnouncementCard tail. No changes written.")

    text = text[:start] + text[end:]
    print("✅ Removed leftover old AnnouncementCard tail.")
else:
    print("ℹ️ No leftover AnnouncementCard tail found.")

# ─────────────────────────────────────────────────────────────────────────────
# Final safety checks
# ─────────────────────────────────────────────────────────────────────────────

bad_tails = re.findall(r"^\}\)\s*\{", text, flags=re.MULTILINE)

if bad_tails:
    print("❌ Still found malformed `}) {` tokens after cleanup.")
    print("Run this to inspect them:")
    print("rg -n '^\\}\\)\\s*\\{' src/components/views/AnnouncementsView.jsx -C 6")
    raise SystemExit("No changes written.")

required = [
    "function AttachmentGallery",
    "function AttachmentInput",
    "function CommentSection",
    "function AnnouncementCard",
    "export default function AnnouncementsView",
    "Signal Board",
    "Team Broadcast",
    "Broadcast Update",
]

for marker in required:
    if marker not in text:
        raise SystemExit(f"❌ Safety check failed: missing `{marker}` after cleanup. No changes written.")

if text.count("function AttachmentGallery") != 1:
    raise SystemExit("❌ Safety check failed: AttachmentGallery count is not exactly 1. No changes written.")

if text.count("function AnnouncementCard") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementCard count is not exactly 1. No changes written.")

if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count is not exactly 1. No changes written.")

if text == original:
    print("ℹ️ No file changes were needed.")
else:
    path.write_text(text)
    print("✅ AnnouncementsView.jsx duplicate tails fixed.")
    print("✅ Backend untouched.")
    print("✅ Existing visual refinements preserved.")

