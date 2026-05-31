from pathlib import Path
import shutil
from datetime import datetime
import re

path = Path("src/announcements/announcements.controller.ts")
if not path.exists():
    raise FileNotFoundError(path)

backup = path.with_suffix(
    path.suffix + f".backup-before-disable-announcements-throttle-dev-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

text = path.read_text()

# Clean throttler import.
text = re.sub(
    r"import\s+\{\s*SkipThrottle\s*,\s*Throttle\s*\}\s+from '@nestjs/throttler';",
    "import { SkipThrottle } from '@nestjs/throttler';",
    text,
)

text = re.sub(
    r"import\s+\{\s*Throttle\s*,\s*SkipThrottle\s*\}\s+from '@nestjs/throttler';",
    "import { SkipThrottle } from '@nestjs/throttler';",
    text,
)

# Remove leftover @Throttle decorators inside this controller.
text = re.sub(
    r"\n\s*@Throttle\(\{[\s\S]*?\}\)\n\s*@Post\(':id/like'\)",
    "\n  @Post(':id/like')",
    text,
    count=1,
)

# Normalize like route skip.
text = text.replace(
    "  @SkipThrottle()\n  @Post(':id/like')",
    "  @Post(':id/like')"
)

text = text.replace(
    "  @SkipThrottle({ default: true })\n  @Post(':id/like')",
    "  @Post(':id/like')"
)

# Add controller-level skip for default + common named throttlers.
controller_line = "@Controller('projects/:projectId/announcements')"
skip_line = "@SkipThrottle({ default: true, short: true, medium: true, long: true })"

if skip_line not in text:
    text = text.replace(controller_line, f"{skip_line}\n{controller_line}", 1)

if skip_line not in text:
    raise RuntimeError("Could not add controller-level SkipThrottle.")

path.write_text(text)

print("✅ Disabled throttling for AnnouncementsController in dev.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify with:")
print("grep -n -B 6 -A 12 \"Controller('projects/:projectId/announcements')\" src/announcements/announcements.controller.ts")
