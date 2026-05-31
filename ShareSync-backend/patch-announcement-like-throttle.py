from pathlib import Path
from datetime import datetime

path = Path("src/announcements/announcements.controller.ts")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()
backup = path.with_suffix(
    path.suffix + f".backup-before-like-throttle-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

# Add Throttle import if missing
if "from '@nestjs/throttler'" not in text and 'from "@nestjs/throttler"' not in text:
    lines = text.splitlines()
    import_indexes = [i for i, line in enumerate(lines) if line.startswith("import ")]
    if not import_indexes:
        raise RuntimeError("Could not find import section in announcements.controller.ts")
    lines.insert(import_indexes[-1] + 1, "import { Throttle } from '@nestjs/throttler';")
    text = "\n".join(lines) + "\n"

# Add/replace throttle directly above the like route
target = "  @Post(':id/like')"
replacement = "  @Throttle({ default: { limit: 120, ttl: 60000 } })\n  @Post(':id/like')"

if replacement not in text:
    if target not in text:
        raise RuntimeError("Could not find @Post(':id/like') in announcements.controller.ts")
    text = text.replace(target, replacement, 1)

path.write_text(text)

print("✅ Announcement like throttle patched.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify with:")
print("grep -n -B 6 -A 12 \"@Post(':id/like')\" src/announcements/announcements.controller.ts")
