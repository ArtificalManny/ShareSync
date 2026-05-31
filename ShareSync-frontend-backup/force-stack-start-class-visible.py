from pathlib import Path
from datetime import datetime
import re
import shutil

row_path = Path("src/features/stack/StackTaskRow.jsx")

if not row_path.exists():
    raise RuntimeError("Could not find src/features/stack/StackTaskRow.jsx")

row_text = row_path.read_text()

if "stack-start-action" not in row_text:
    raise RuntimeError(
        "StackTaskRow.jsx does not contain stack-start-action. "
        "Run: grep -n -B 20 -A 40 \"primaryAction\" src/features/stack/StackTaskRow.jsx"
    )

css_candidates = [
    Path("src/theme.css"),
    Path("src/index.css"),
    Path("src/App.css"),
]

css_path = next((p for p in css_candidates if p.exists()), None)

if not css_path:
    raise RuntimeError("Could not find src/theme.css, src/index.css, or src/App.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_name(css_path.name + f".backup-before-stack-start-class-visible-{stamp}")
shutil.copy2(css_path, backup)

css = css_path.read_text()

start_marker = "/* openshare-stack-start-action-force-v2 */"
end_marker = "/* /openshare-stack-start-action-force-v2 */"

block = f"""
{start_marker}

/*
  Moves / Stack Start button visibility fix.
  This targets the actual button class generated inside:
  src/features/stack/StackTaskRow.jsx

  Goal:
  - Make Start visible in light mode
  - Preserve disabled logic
  - Prevent pale/washed-out theme rules from hiding it
*/
button.stack-start-action,
.stack-start-action {
  opacity: 1 !important;
  visibility: visible !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  border: 1px solid rgba(124, 58, 237, 0.72) !important;
  box-shadow:
    0 14px 30px rgba(124, 58, 237, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.32) !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

button.stack-start-action *,
.stack-start-action *,
.stack-start-action span,
.stack-start-action svg {
  color: #ffffff !important;
  stroke: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

button.stack-start-action:hover:not(:disabled),
.stack-start-action:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 52%, #5b21b6 100%) !important;
  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
  transform: translateY(-1px) !important;
}

/*
  Keep disabled Start readable.
  It can still be disabled logically, but it should not disappear.
*/
button.stack-start-action:disabled,
.stack-start-action:disabled,
.stack-start-action[disabled] {
  opacity: 1 !important;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  border-color: rgba(167, 139, 250, 0.95) !important;
  box-shadow:
    0 10px 24px rgba(124, 58, 237, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
  cursor: not-allowed !important;
}

button.stack-start-action:disabled *,
.stack-start-action:disabled *,
.stack-start-action[disabled] *,
.stack-start-action:disabled span,
.stack-start-action[disabled] span,
.stack-start-action:disabled svg,
.stack-start-action[disabled] svg {
  color: #ffffff !important;
  stroke: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
}

{end_marker}
"""

pattern = re.compile(
    re.escape(start_marker) + r".*?" + re.escape(end_marker),
    flags=re.DOTALL,
)

if start_marker in css:
    css = pattern.sub(block.strip(), css)
else:
    css = css.rstrip() + "\n\n" + block.strip() + "\n"

css_path.write_text(css)

print("✅ Forced Moves Start button visibility using .stack-start-action.")
print(f"Updated CSS file: {css_path}")
print(f"Backup saved at: {backup}")
print("")
print("Next:")
print("1. Stop Vite with Control+C")
print("2. Restart: npm run dev")
print("3. Hard refresh Chrome: Cmd+Shift+R")
