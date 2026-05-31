from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/announcements/announcements.controller.ts")
if not path.exists():
    raise FileNotFoundError(path)

backup = path.with_suffix(path.suffix + f".backup-before-like-throttle-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(path, backup)

text = path.read_text()

text = text.replace(
    "import { SkipThrottle, Throttle } from '@nestjs/throttler';",
    "import { SkipThrottle, Throttle } from '@nestjs/throttler';",
)

old = """  @SkipThrottle()
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req: any) {"""

new = """  @SkipThrottle({ default: true })
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req: any) {"""

if old not in text:
    raise RuntimeError(
        "Could not find the exact like route block. Run:\n"
        "grep -n -B 8 -A 18 \"@Post(':id/like')\" src/announcements/announcements.controller.ts"
    )

text = text.replace(old, new, 1)
path.write_text(text)

print("✅ Announcement like throttle hardened.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify:")
print("grep -n -B 8 -A 18 \"@Post(':id/like')\" src/announcements/announcements.controller.ts")
