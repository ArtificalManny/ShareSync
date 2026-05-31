from pathlib import Path
from datetime import datetime

targets = [
    Path("src/components/context/ContextIndicator.jsx"),
    Path("src/components/momentum/AICoachWhisper.jsx"),
]

css_path = Path("src/index.css")

changed_files = []

for path in targets:
    if not path.exists():
        continue

    text = path.read_text()
    original = text

    backup = path.with_suffix(
        path.suffix + f".backup-floating-ai-center-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)

    if path.name == "ContextIndicator.jsx":
        text = text.replace(
            'className="fixed bottom-6 right-6 z-50"',
            'className="floating-ai-center-scope fixed bottom-6 right-6 z-50"',
            1,
        )

        text = text.replace(
            'className="fixed bottom-6 right-6 z-[50]"',
            'className="floating-ai-center-scope fixed bottom-6 right-6 z-[50]"',
            1,
        )

    if path.name == "AICoachWhisper.jsx":
        text = text.replace(
            'className="fixed bottom-6 right-6 z-40"',
            'className="floating-ai-center-scope fixed bottom-6 right-6 z-40"',
            1,
        )

        text = text.replace(
            'className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm"',
            'className="floating-ai-center-core w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 grid place-items-center p-0 leading-none text-white font-bold text-sm"',
            1,
        )

    bad_patterns = [
        "onClick={() =",
        "className={` =",
        "className={ =",
    ]

    for bad in bad_patterns:
        if bad in text:
            path.write_text(original)
            raise RuntimeError(f"Unsafe JSX corruption pattern detected in {path}: {bad}. Original restored.")

    if text != original:
        path.write_text(text)
        changed_files.append(str(path))

if not changed_files:
    raise RuntimeError(
        "No floating AI button targets were changed. Run sed -n '1,150p' src/components/context/ContextIndicator.jsx and send the output."
    )

css = css_path.read_text()
css_backup = css_path.with_suffix(
    css_path.suffix + f".backup-floating-ai-center-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
css_backup.write_text(css)

css_patch = r'''

/* ─────────────────────────────────────────────────────────────────────────
   Floating AI button icon centering
   Centers the visible sparkle inside the bottom-right circular assistant button.
───────────────────────────────────────────────────────────────────────── */
.floating-ai-center-scope {
  display: grid !important;
  place-items: center !important;
  place-content: center !important;
  line-height: 1 !important;
}

.floating-ai-center-scope button,
.floating-ai-center-scope [role="button"],
.floating-ai-center-scope .floating-ai-center-core {
  display: grid !important;
  place-items: center !important;
  place-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.floating-ai-center-scope svg,
.floating-ai-center-core svg {
  display: block !important;
  width: 1.75rem !important;
  height: 1.75rem !important;
  min-width: 1.75rem !important;
  min-height: 1.75rem !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
  position: static !important;
  transform: none !important;
}

.floating-ai-center-scope span,
.floating-ai-center-core span {
  line-height: 1 !important;
}
'''

if "Floating AI button icon centering" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"
    css_path.write_text(css)

print("Floating AI button centering patch applied successfully.")
print("")
print("Changed files:")
for file in changed_files:
    print(f"- {file}")
print(f"- {css_path}")
print("")
print("Backup created for index.css:")
print(f"- {css_backup}")
print("")
print("No backend files were touched.")
print("No AI API calls were changed.")
print("No assistant open/close logic was changed.")
