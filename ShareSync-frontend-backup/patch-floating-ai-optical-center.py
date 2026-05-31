from pathlib import Path
from datetime import datetime

path = Path("src/index.css")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-floating-ai-optical-center-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

patch = r'''

/* Final optical centering for bottom-right AI sparkle button */
.floating-ai-center-scope svg {
  transform: translate(1px, -1px) !important;
  transform-origin: center center !important;
}
'''

if "Final optical centering for bottom-right AI sparkle button" not in text:
    text = text.rstrip() + "\n" + patch + "\n"

path.write_text(text)

print("Floating AI optical centering patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Added tiny 1px right / 1px up optical nudge for the floating AI sparkle icon")
print("")
print("No JSX files were touched.")
print("No backend files were touched.")
