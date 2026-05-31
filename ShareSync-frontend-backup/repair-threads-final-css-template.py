from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-repair-final-css-template-{timestamp}"
)
backup_path.write_text(original)

marker = "/* FINAL visibility override: Discussion buttons only */"

start = original.find(marker)
if start == -1:
    raise RuntimeError("Could not find the broken final CSS marker. No changes were written.")

style_close = original.find("</style>", start)
if style_close == -1:
    raise RuntimeError("Could not find closing </style> after broken CSS marker. No changes were written.")

raw_block = original[start:style_close].strip()

# If the broken CSS was inserted as raw JSX text, wrap it as a valid JSX template-string child.
wrapped_block = "\n        {`\n" + raw_block + "\n        `}\n      "

updated = original[:start] + wrapped_block + original[style_close:]

# Safety checks.
bad_patterns = [
    "onClick={() =",
    "onClick={()= className",
    "className==",
]

for bad in bad_patterns:
    if bad in updated:
        FILE_PATH.write_text(original)
        raise RuntimeError(f"Unsafe pattern still present: {bad}. Original restored.")

FILE_PATH.write_text(updated)

print("ThreadsView JSX style repair applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Wrapped the final Discussion button CSS override inside a valid JSX template string")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread logic, modal logic, filtering, fetching, messaging, or create-discussion logic was changed.")
