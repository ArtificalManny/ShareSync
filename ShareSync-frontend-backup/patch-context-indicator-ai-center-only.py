from pathlib import Path
from datetime import datetime

path = Path("src/components/context/ContextIndicator.jsx")
css_path = Path("src/index.css")

if not path.exists():
    raise RuntimeError("Could not find src/components/context/ContextIndicator.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".backup-ai-center-only-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

# Add a class hook to the fixed bottom-right wrapper if it exists.
replacements = [
    (
        'className="fixed bottom-6 right-6 z-50"',
        'className="floating-ai-center-scope fixed bottom-6 right-6 z-50"',
    ),
    (
        'className="fixed bottom-6 right-6 z-[50]"',
        'className="floating-ai-center-scope fixed bottom-6 right-6 z-[50]"',
    ),
    (
        'className="fixed bottom-5 right-5 z-50"',
        'className="floating-ai-center-scope fixed bottom-5 right-5 z-50"',
    ),
    (
        'className="fixed bottom-5 right-5 z-[50]"',
        'className="floating-ai-center-scope fixed bottom-5 right-5 z-[50]"',
    ),
]

changed = False
for old, new in replacements:
    if old in text and new not in text:
        text = text.replace(old, new, 1)
        changed = True
        break

# Add direct centering to the most likely circle button classes.
button_replacements = [
    (
        "flex items-center justify-center",
        "grid place-items-center",
    ),
]

# Only do this inside ContextIndicator, once. This is safe for the floating button layout.
if "floating-ai-center-scope" in text:
    text = text.replace("flex items-center justify-center", "grid place-items-center", 1)
    changed = True

if not changed and "floating-ai-center-scope" not in text:
    raise RuntimeError("Could not find the fixed bottom-right ContextIndicator wrapper. Send sed -n '1,220p' src/components/context/ContextIndicator.jsx")

# Do not block because another file has old corruption text. Only check this file after edit.
for bad in ["onClick={() =", "className={` =", "className={ ="]:
    if bad in text:
        path.write_text(original)
        raise RuntimeError(f"Unsafe JSX pattern detected in ContextIndicator only: {bad}. Original restored.")

path.write_text(text)

css = css_path.read_text()
css_backup = css_path.with_suffix(
    css_path.suffix + f".backup-ai-center-only-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
css_backup.write_text(css)

css_patch = r'''

/* ContextIndicator floating AI button centering */
.floating-ai-center-scope {
  display: grid !important;
  place-items: center !important;
  place-content: center !important;
  line-height: 1 !important;
}

.floating-ai-center-scope button,
.floating-ai-center-scope [role="button"] {
  display: grid !important;
  place-items: center !important;
  place-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.floating-ai-center-scope svg {
  display: block !important;
  width: 1.85rem !important;
  height: 1.85rem !important;
  margin: 0 !important;
  padding: 0 !important;
  position: static !important;
  transform: translate(0, 0) !important;
}
'''

if "ContextIndicator floating AI button centering" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"
    css_path.write_text(css)

print("ContextIndicator AI button centering patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("No AICoachWhisper.jsx changes.")
print("No backend files touched.")
