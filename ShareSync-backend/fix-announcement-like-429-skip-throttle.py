from pathlib import Path
from datetime import datetime
import re

path = Path("src/announcements/announcements.controller.ts")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()
backup = path.with_suffix(
    path.suffix + f".backup-before-skip-like-throttle-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

# Ensure SkipThrottle is imported
throttler_import_match = re.search(r"import\s+\{([^}]+)\}\s+from\s+['\"]@nestjs/throttler['\"];", text)

if throttler_import_match:
    names = [name.strip() for name in throttler_import_match.group(1).split(",")]
    if "SkipThrottle" not in names:
        names.insert(0, "SkipThrottle")
        new_import = "import { " + ", ".join(names) + " } from '@nestjs/throttler';"
        text = text[:throttler_import_match.start()] + new_import + text[throttler_import_match.end():]
else:
    import_lines = list(re.finditer(r"^import .+;$", text, flags=re.MULTILINE))
    if not import_lines:
        raise RuntimeError("Could not find import section.")
    insert_at = import_lines[-1].end()
    text = text[:insert_at] + "\nimport { SkipThrottle } from '@nestjs/throttler';" + text[insert_at:]

# Remove any direct throttle decorator immediately above the like route, then add SkipThrottle
pattern = re.compile(
    r"(?P<indent>[ \t]*)"
    r"(?:@Throttle\(\{[\s\S]*?\}\)\s*\n[ \t]*)?"
    r"@Post\((['\"]):id/like\2\)",
    flags=re.MULTILINE,
)

matches = list(pattern.finditer(text))
if not matches:
    raise RuntimeError(
        "Could not find @Post(':id/like'). Run:\n"
        "grep -n -B 8 -A 18 \"like\" src/announcements/announcements.controller.ts"
    )

match = matches[0]
indent = match.group("indent")
replacement = f"{indent}@SkipThrottle()\n{indent}@Post(':id/like')"

text = text[:match.start()] + replacement + text[match.end():]

# De-dupe accidental double SkipThrottle above the same route
text = re.sub(
    r"([ \t]*)@SkipThrottle\(\)\s*\n\1@SkipThrottle\(\)\s*\n\1@Post\(':id/like'\)",
    r"\1@SkipThrottle()\n\1@Post(':id/like')",
    text,
)

path.write_text(text)

print("✅ Announcement Like 429 fix applied.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify with:")
print("grep -n -B 8 -A 18 \"@Post(':id/like')\" src/announcements/announcements.controller.ts")
