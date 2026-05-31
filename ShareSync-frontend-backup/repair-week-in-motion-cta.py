from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/components/home/WeekInMotion.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/components/home/WeekInMotion.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-cta-repair-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# 1) Make sure useCallback is imported.
if "useCallback" not in text:
    text = text.replace(
        'import React, { useEffect, useMemo, useRef, useState } from "react";',
        'import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";'
    )
    text = text.replace(
        "import React, { useEffect, useMemo, useRef, useState } from 'react';",
        "import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';"
    )

# 2) Make sure Sparkles is imported. Most recent WeekInMotion already has it.
if "Sparkles" not in text:
    text = text.replace(
        "Zap,",
        "Zap,\n  Sparkles,"
    )

# 3) Insert a useful fallback click handler.
handler = '''  const handleRhythmAction = useCallback(() => {
    if (typeof onShipNow === "function") {
      onShipNow();
      return;
    }

    window.location.href = "/projects";
  }, [onShipNow]);

'''

if "const handleRhythmAction = useCallback" not in text:
    marker = "  if (loading) {"
    if marker not in text:
        raise RuntimeError("Could not find loading block marker. No changes written.")
    text = text.replace(marker, handler + marker, 1)

# 4) Find the existing Ship Something button and replace only that button.
label_match = re.search(r"Ship\s+something", text, re.IGNORECASE)

if not label_match:
    raise RuntimeError("Could not find the existing 'Ship something' button label. No changes written.")

label_index = label_match.start()
button_start = text.rfind("<button", 0, label_index)
button_end = text.find("</button>", label_index)

if button_start == -1 or button_end == -1:
    raise RuntimeError("Could not safely locate the Ship Something button block. No changes written.")

button_end += len("</button>")

new_button = '''<button
            type="button"
            onClick={handleRhythmAction}
            className="group inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-2xl border border-violet-300/70 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_38px_rgba(139,92,246,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 dark:border-cyan-300/35 dark:from-violet-500 dark:via-fuchsia-500 dark:to-cyan-400 dark:text-white dark:shadow-[0_0_28px_rgba(34,211,238,0.22),0_18px_42px_rgba(139,92,246,0.30)]"
            title="Open your projects to choose the next task to ship"
          >
            <Sparkles className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
            <span>Open Projects</span>
          </button>'''

text = text[:button_start] + new_button + text[button_end:]

# 5) If the button was only showing when onShipNow existed, allow fallback navigation.
text = text.replace("{showCTA && onShipNow && (", "{showCTA && (")

# 6) Safety checks.
bad_patterns = [
    "onClick={() =",
    "className==",
    "<button<button",
]

for bad in bad_patterns:
    if bad in text:
        shutil.copy2(backup, path)
        raise RuntimeError(f"Unsafe JSX pattern detected: {bad}. Original restored.")

if "handleRhythmAction" not in text or "Open Projects" not in text:
    shutil.copy2(backup, path)
    raise RuntimeError("Patch verification failed. Original restored.")

path.write_text(text)

print("WeekInMotion CTA repair applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Replaced 'Ship Something' with a useful 'Open Projects' CTA")
print("- Added fallback navigation to /projects if onShipNow is not wired")
print("- Made the button much more visible in dark mode")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No weekly rhythm logic changed.")
