from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/features/stack/StackTaskRow.jsx")
text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(path.name + f".backup-before-force-start-visible-{stamp}")
shutil.copy2(path, backup)

# Remove the generic disabled fade if it still exists
text = text.replace(
    "disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}",
    "disabled:cursor-not-allowed transition-colors flex-shrink-0 ${primaryAction.classes}"
)

needle = '''                  onClick={primaryAction.onClick}
                  className={`stack-task-action inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg
                    disabled:cursor-not-allowed transition-colors flex-shrink-0 ${primaryAction.classes}`}'''

replacement = '''                  onClick={primaryAction.onClick}
                  style={
                    primaryAction.label === "Start"
                      ? {
                          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 55%, #6d28d9 100%)",
                          color: "#ffffff",
                          opacity: 1,
                          border: "1px solid rgba(124, 58, 237, 0.55)",
                          boxShadow: "0 12px 28px rgba(124, 58, 237, 0.28)",
                          WebkitTextFillColor: "#ffffff",
                        }
                      : undefined
                  }
                  className={`stack-task-action inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg
                    disabled:cursor-not-allowed transition-colors flex-shrink-0 ${primaryAction.classes}`}'''

if needle not in text:
    raise RuntimeError(
        "Could not find the exact action button block. Run this and paste it:\n"
        "grep -n -B 8 -A 18 \"onClick={primaryAction.onClick}\" src/features/stack/StackTaskRow.jsx"
    )

text = text.replace(needle, replacement, 1)

path.write_text(text)

print("✅ Forced Start button visibility applied.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Start button now uses inline violet styling")
print("- Inline style overrides disabled opacity / weak light-mode styling")
print("- Button remains logically disabled if the task is not startable")
