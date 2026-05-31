from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/theme.css")

if not path.exists():
    raise RuntimeError("Could not find src/theme.css")

text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(path.name + f".backup-before-moves-start-css-{stamp}")
shutil.copy2(path, backup)

marker = "/* openshare-moves-start-button-force-visible-v1 */"

css = f"""

{marker}
.stack-task-action,
.stack-task-action:disabled,
.stack-task-action[disabled] {{
  opacity: 1 !important;
  visibility: visible !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #6d28d9 100%) !important;
  border: 1px solid rgba(124, 58, 237, 0.72) !important;
  box-shadow:
    0 14px 32px rgba(124, 58, 237, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.45) !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}}

.stack-task-action *,
.stack-task-action:disabled *,
.stack-task-action[disabled] * {{
  opacity: 1 !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  stroke: #ffffff !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}}

.stack-task-action:hover:not(:disabled) {{
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 52%, #5b21b6 100%) !important;
  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
  transform: translateY(-1px);
}}
/* end openshare-moves-start-button-force-visible-v1 */
"""

if marker in text:
    before = text.split(marker)[0].rstrip()
    text = before + css
else:
    text = text.rstrip() + css

path.write_text(text)

print("✅ Added global Moves Start button visibility override.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Forces .stack-task-action buttons to be visible in light mode")
print("- Prevents disabled opacity from washing out the Start button")
print("- Keeps dark mode readable too")
