from pathlib import Path
from datetime import datetime
import shutil
import re

row_path = Path("src/features/stack/StackTaskRow.jsx")
css_path = Path("src/theme.css")

if not row_path.exists():
    raise RuntimeError(f"Missing file: {row_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
row_backup = row_path.with_suffix(row_path.suffix + f".backup-before-start-button-final-{stamp}")
shutil.copy2(row_path, row_backup)

text = row_path.read_text()
original = text

# 1. Stop disabled task rows from visually fading the whole row.
text, row_opacity_count = re.subn(
    r'\$\{disabled\s*&&\s*!completing\s*\?\s*"opacity-\d+"\s*:\s*""\}',
    '${disabled && !completing ? "opacity-100" : ""}',
    text,
    count=1,
)

# 2. Stop the primary action button from fading when disabled.
text = text.replace("disabled:opacity-50", "disabled:!opacity-100")

# 3. Add a data attribute + inline style to the primary action button.
# This targets the rendered button, not the fragile class string.
if 'data-openshare-primary-action={primaryAction.label}' not in text:
    pattern = re.compile(
        r'(onClick=\{primaryAction\.onClick\}\s*)'
        r'(className=\{`stack-task-action)',
        re.MULTILINE,
    )

    def inject_button_attributes(match):
        return (
            match.group(1)
            + 'data-openshare-primary-action={primaryAction.label}\n'
            + '                  style={primaryAction.label === "Start" ? {\n'
            + '                    opacity: 1,\n'
            + '                    color: "#ffffff",\n'
            + '                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)",\n'
            + '                    border: "1px solid rgba(196, 181, 253, 0.95)",\n'
            + '                    boxShadow: "0 14px 34px rgba(124, 58, 237, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.34)",\n'
            + '                    textShadow: "0 1px 2px rgba(15, 23, 42, 0.38)",\n'
            + '                  } : undefined}\n'
            + '                  '
            + match.group(2)
        )

    text, attr_count = pattern.subn(inject_button_attributes, text, count=1)

    if attr_count == 0:
        row_path.write_text(original)
        raise RuntimeError(
            "Could not find the primary action button render block.\n"
            "Run this and paste the output:\n"
            "grep -n -B 8 -A 18 'onClick={primaryAction.onClick}' src/features/stack/StackTaskRow.jsx"
        )

# 4. Strengthen the Start classes if they still exist, but do not depend on this.
text = re.sub(
    r'classes:\s*\n\s*"[^"]*bg-violet-600[^"]*text-white[^"]*"',
    'classes:\n          "stack-start-action openshare-start-cta !bg-violet-700 hover:!bg-violet-800 !text-white border border-violet-400/90 shadow-[0_14px_34px_rgba(124,58,237,0.42)] ring-1 ring-white/60 disabled:!opacity-100 disabled:!bg-violet-700 disabled:!text-white disabled:!border-violet-400/90 disabled:cursor-not-allowed"',
    text,
    count=1,
)

if text == original:
    raise RuntimeError("No changes were made. The file may already be patched or structurally different.")

row_path.write_text(text)

# 5. Add a global CSS safety override.
if not css_path.exists():
    raise RuntimeError("src/theme.css was not found.")

css_backup = css_path.with_suffix(css_path.suffix + f".backup-before-start-button-final-{stamp}")
shutil.copy2(css_path, css_backup)

css = css_path.read_text()

start_marker = "/* openshare-start-button-final-visibility-v1 */"
end_marker = "/* end openshare-start-button-final-visibility-v1 */"

block = f"""
{start_marker}
button[data-openshare-primary-action="Start"],
button[data-openshare-primary-action="Start"]:disabled,
button[data-openshare-primary-action="Start"][disabled] {{
  opacity: 1 !important;
  visibility: visible !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
  border: 1px solid rgba(196, 181, 253, 0.95) !important;
  box-shadow:
    0 14px 34px rgba(124, 58, 237, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.38) !important;
  min-width: 82px !important;
}}

button[data-openshare-primary-action="Start"] *,
button[data-openshare-primary-action="Start"]:disabled *,
button[data-openshare-primary-action="Start"][disabled] * {{
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  stroke: #ffffff !important;
  opacity: 1 !important;
}}
{end_marker}
"""

if start_marker in css and end_marker in css:
    css = re.sub(
        re.escape(start_marker) + r".*?" + re.escape(end_marker),
        block.strip(),
        css,
        flags=re.DOTALL,
    )
else:
    css = css.rstrip() + "\n\n" + block.strip() + "\n"

css_path.write_text(css)

print("✅ Final Moves Start button visibility patch applied.")
print(f"Updated row file: {row_path}")
print(f"Row backup:       {row_backup}")
print(f"Updated CSS file: {css_path}")
print(f"CSS backup:       {css_backup}")
print("")
print("Verify:")
print("grep -n -B 5 -A 16 'data-openshare-primary-action' src/features/stack/StackTaskRow.jsx")
print("grep -n 'openshare-start-button-final' src/theme.css")
print("")
print("Then restart Vite and hard refresh Chrome.")
