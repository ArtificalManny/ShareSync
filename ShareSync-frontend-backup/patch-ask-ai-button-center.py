from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/components/assistant/AskAIButton.jsx")
css_path = Path("src/styles/assistant.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

jsx_backup = jsx_path.with_suffix(
    jsx_path.suffix + f".backup-center-ask-ai-button-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
css_backup = css_path.with_suffix(
    css_path.suffix + f".backup-center-ask-ai-button-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)

jsx_backup.write_text(jsx)
css_backup.write_text(css)

original_jsx = jsx

# 1) Add a stable class hook to the floating fixed bottom/right button.
# Handles normal className="..." and template className={`...`}.
patterns = [
    re.compile(r'(className=")(?P<classes>[^"]*\bfixed\b[^"]*\bbottom-[^\s"]+\b[^"]*\bright-[^\s"]+\b[^"]*)(")'),
    re.compile(r'(className=")(?P<classes>[^"]*\bfixed\b[^"]*\bright-[^\s"]+\b[^"]*\bbottom-[^\s"]+\b[^"]*)(")'),
    re.compile(r'(className=\{`)(?P<classes>[^`]*\bfixed\b[^`]*\bbottom-[^\s`]+\b[^`]*\bright-[^\s`]+\b[^`]*)(`\})'),
    re.compile(r'(className=\{`)(?P<classes>[^`]*\bfixed\b[^`]*\bright-[^\s`]+\b[^`]*\bbottom-[^\s`]+\b[^`]*)(`\})'),
]

added_fab_class = False

def add_fab_class(match):
    global added_fab_class
    prefix = match.group(1)
    classes = match.group("classes")
    suffix = match.group(3)

    if "askai-fab" not in classes:
        classes = "askai-fab " + classes
        added_fab_class = True

    # Force centering through Tailwind too, while CSS also reinforces it.
    for needed in ["grid", "place-items-center", "p-0", "leading-none"]:
        if needed not in classes:
            classes += " " + needed
            added_fab_class = True

    return prefix + classes + suffix

for pattern in patterns:
    jsx, count = pattern.subn(add_fab_class, jsx, count=1)
    if count:
        break

if not added_fab_class and "askai-fab" not in jsx:
    raise RuntimeError("Could not find the floating fixed bottom/right AskAI button. No changes were written.")

# 2) Replace only the LAST Sparkles icon in AskAIButton.jsx.
# The last Sparkles match is the floating circular FAB in this component.
sparkles_matches = list(re.finditer(r'<Sparkles\b[^>]*/>', jsx, flags=re.DOTALL))

if not sparkles_matches:
    raise RuntimeError("Could not find a Sparkles icon in AskAIButton.jsx. No changes were written.")

last = sparkles_matches[-1]
old_icon = last.group(0)

if "askai-fab-icon-wrap" not in old_icon and "askai-fab-icon" not in old_icon:
    new_icon = (
        '<span className="askai-fab-icon-wrap" aria-hidden="true">'
        '<Sparkles className="askai-fab-icon block h-7 w-7 text-white" strokeWidth={2.7} />'
        '</span>'
    )
    jsx = jsx[:last.start()] + new_icon + jsx[last.end():]

# 3) Add CSS reinforcement in assistant.css.
css_patch = r'''

/* ─────────────────────────────────────────────────────────────────────────
   ASK AI FLOATING BUTTON CENTERING FIX
   Keeps the pink/red assistant FAB visually centered.
───────────────────────────────────────────────────────────────────────── */
.askai-fab {
  display: grid !important;
  place-items: center !important;
  place-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
  text-align: center !important;
}

.askai-fab > svg,
.askai-fab .askai-fab-icon {
  display: block !important;
  width: 1.75rem !important;
  height: 1.75rem !important;
  min-width: 1.75rem !important;
  min-height: 1.75rem !important;
  margin: 0 !important;
  padding: 0 !important;
  position: static !important;
  transform: none !important;
  flex: 0 0 auto !important;
}

.askai-fab .askai-fab-icon-wrap {
  display: grid !important;
  place-items: center !important;
  place-content: center !important;
  width: 100% !important;
  height: 100% !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.askai-fab * {
  box-sizing: border-box !important;
}
'''

if "ASK AI FLOATING BUTTON CENTERING FIX" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in jsx:
        jsx_path.write_text(original_jsx)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Ask AI floating button centering patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added askai-fab centering class to the floating AskAI button")
print("- Wrapped the floating Sparkles icon in a full-size centering span")
print("- Added CSS-only centering reinforcement in assistant.css")
print("")
print("No backend files were touched.")
print("No AI API calls were changed.")
print("No assistant open/close logic was changed.")
