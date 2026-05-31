from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-repair-raw-css-inside-style-{timestamp}"
)
backup_path.write_text(original)

marker = "/* FINAL visibility override: Discussion buttons only */"

marker_index = original.find(marker)
if marker_index == -1:
    raise RuntimeError("Could not find FINAL visibility override marker. No changes were written.")

style_close_index = original.find("</style>", marker_index)
if style_close_index == -1:
    raise RuntimeError("Could not find </style> after FINAL visibility override marker. No changes were written.")

# The problem is that the existing template string closes right BEFORE the final CSS block.
# Remove the closest preceding template-string close so the final CSS becomes part of the same CSS string.
before_marker = original[:marker_index]
after_marker = original[marker_index:]

close_candidates = [
    "\n          `}\n        \n        ",
    "\n          `}\n        \n",
    "\n          `}\n        ",
    "\n          `}\n",
]

close_found = None
close_pos = -1

search_window_start = max(0, marker_index - 800)
window = original[search_window_start:marker_index]

for candidate in close_candidates:
    local_pos = window.rfind(candidate)
    if local_pos != -1:
        close_found = candidate
        close_pos = search_window_start + local_pos
        break

if close_found is None:
    raise RuntimeError(
        "Could not find the template-string close immediately before the broken CSS block. "
        "No changes were written."
    )

updated = original[:close_pos] + "\n        " + original[marker_index:]

# Recalculate marker/style close after removing the earlier template close.
marker_index = updated.find(marker)
style_close_index = updated.find("</style>", marker_index)

if style_close_index == -1:
    raise RuntimeError("Could not find </style> after repair. No changes were written.")

# Insert one proper template-string close immediately before </style>.
before_style_close = updated[:style_close_index].rstrip()
after_style_close = updated[style_close_index:]

if not before_style_close.endswith("`}"):
    updated = before_style_close + "\n          `}\n        " + after_style_close

FILE_PATH.write_text(updated)

print("ThreadsView raw CSS repair applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Reopened the existing style template string before the final Discussion button CSS")
print("- Closed the style template string correctly before </style>")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread logic, modal logic, filtering, fetching, messaging, or create-discussion logic was changed.")
