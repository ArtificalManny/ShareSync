from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-unclosed-helper-braces-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

def ensure_helper_closed_before(text, helper_marker, next_marker, label):
    if helper_marker not in text:
        raise SystemExit(f"❌ Could not find {label} marker `{helper_marker}`. No changes written.")

    if next_marker not in text:
        raise SystemExit(f"❌ Could not find next marker `{next_marker}` after {label}. No changes written.")

    start = text.find(helper_marker)
    next_start = text.find(next_marker, start)

    if next_start == -1:
        raise SystemExit(f"❌ Could not find `{next_marker}` after {label}. No changes written.")

    segment = text[start:next_start]
    trimmed = segment.rstrip()

    # If the helper already ends with a closing brace, leave it alone.
    if trimmed.endswith("}"):
        print(f"ℹ️ {label} already appears to be closed.")
        return text

    # Most React helper components should end with `);` then `}`.
    if not trimmed.endswith(");"):
        print(f"⚠️ {label} does not end with `);` before the next function.")
        print("Showing tail for inspection:")
        print(trimmed[-500:])
        raise SystemExit("No changes written.")

    insert_at = next_start
    fixed = text[:insert_at].rstrip() + "\n}\n\n" + text[insert_at:].lstrip()
    print(f"✅ Added missing closing brace for {label}.")
    return fixed

# The current TypeScript error points to the helper beginning around line 177.
# This is almost certainly AttachmentGallery being left open.
text = ensure_helper_closed_before(
    text,
    "function AttachmentGallery",
    "function AttachmentInput",
    "AttachmentGallery",
)

# Also protect AnnouncementCard, because this was touched by the visual refinement too.
text = ensure_helper_closed_before(
    text,
    "function AnnouncementCard",
    "// ─── Main Component",
    "AnnouncementCard",
)

# Safety checks
if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count is not exactly 1. No changes written.")

if text.count("function AttachmentGallery") != 1:
    raise SystemExit("❌ Safety check failed: AttachmentGallery count is not exactly 1. No changes written.")

if text.count("function AttachmentInput") != 1:
    raise SystemExit("❌ Safety check failed: AttachmentInput count is not exactly 1. No changes written.")

if text.count("function AnnouncementCard") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementCard count is not exactly 1. No changes written.")

if "\n}) {\n" in text:
    raise SystemExit("❌ Safety check failed: malformed `}) {` still exists. No changes written.")

# Show the important region after fixing
path.write_text(text)

print("✅ AnnouncementsView.jsx helper brace repair complete.")
print("✅ Backend untouched.")
print("✅ Visual refinements preserved.")
print("")
print("Now inspect these areas:")
print("sed -n '160,220p' src/components/views/AnnouncementsView.jsx")
print("sed -n '585,615p' src/components/views/AnnouncementsView.jsx")
