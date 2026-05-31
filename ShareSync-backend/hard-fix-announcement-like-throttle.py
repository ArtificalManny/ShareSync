from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/announcements/announcements.controller.ts")
if not path.exists():
    raise FileNotFoundError(path)

backup = path.with_suffix(
    path.suffix + f".backup-before-hard-like-throttle-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

text = path.read_text()

# Make the import clean and explicit.
text = text.replace(
    "import { SkipThrottle, Throttle } from '@nestjs/throttler';",
    "import { SkipThrottle, Throttle } from '@nestjs/throttler';"
)

# Upgrade SkipThrottle to explicitly skip the default throttler.
text = text.replace(
    "  @SkipThrottle()\n  @Post(':id/like')",
    "  @SkipThrottle({ default: true })\n  @Throttle({ default: { limit: 1000, ttl: 60000 } })\n  @Post(':id/like')"
)

if "@SkipThrottle({ default: true })" not in text:
    raise RuntimeError(
        "Could not patch the like route. Paste this output:\n"
        "grep -n -B 10 -A 20 \"@Post(':id/like')\" src/announcements/announcements.controller.ts"
    )

path.write_text(text)

print("✅ Hard announcement like throttle fix applied.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify:")
print("grep -n -B 10 -A 22 \"@Post(':id/like')\" src/announcements/announcements.controller.ts")
