from pathlib import Path
import re
import shutil
from datetime import datetime

path = Path("src/announcements/announcements.service.ts")
backup = path.with_suffix(path.suffix + f".backup-before-like-persistence-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")

text = path.read_text()
original = text
shutil.copy2(path, backup)

# 1) Make likedBy load from the real persisted likes array first.
text, count_1 = re.subn(
    r"const\s+likedBy\s*=\s*Array\.isArray\(doc\.likedBy\)\s*\?\s*doc\.likedBy\s*:\s*\[\];",
    """const likedBy = Array.isArray((doc as any).likes)
      ? [...(doc as any).likes]
      : Array.isArray((doc as any).likedBy)
        ? [...(doc as any).likedBy]
        : [];""",
    text,
    count=1,
)

# 2) Keep likedBy for compatibility, but make likes the canonical persisted array.
text, count_2 = re.subn(
    r"doc\.likedBy\s*=\s*likedBy;",
    "(doc as any).likedBy = likedBy;",
    text,
    count=1,
)

text, count_3 = re.subn(
    r"doc\.likesCount\s*=\s*likedBy\.length;",
    "(doc as any).likesCount = likedBy.length;",
    text,
    count=1,
)

text, count_4 = re.subn(
    r"doc\.likes\s*=\s*likedBy\.length;",
    "(doc as any).likes = likedBy;",
    text,
    count=1,
)

if count_1 != 1 or count_2 != 1 or count_3 != 1 or count_4 != 1:
    path.write_text(original)
    raise RuntimeError(
        "Patch did not safely match the backend like block. "
        f"Matches: declaration={count_1}, likedBy={count_2}, likesCount={count_3}, likes={count_4}\\n"
        "Run this and paste the output:\\n"
        "sed -n '285,325p' src/announcements/announcements.service.ts"
    )

path.write_text(text)

print("✅ Backend announcement like persistence v2 patched.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify with:")
print("sed -n '289,318p' src/announcements/announcements.service.ts")
