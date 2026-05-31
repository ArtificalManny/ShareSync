from pathlib import Path
from datetime import datetime
import shutil
import re

util_path = Path("src/utils/forceMovesStartButtonVisibility.js")
main_candidates = [Path("src/main.jsx"), Path("src/main.tsx")]
main_path = next((p for p in main_candidates if p.exists()), None)

if main_path is None:
    raise RuntimeError("Could not find src/main.jsx or src/main.tsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

util_path.parent.mkdir(parents=True, exist_ok=True)

if util_path.exists():
    shutil.copy2(util_path, util_path.with_suffix(util_path.suffix + f".backup-before-start-dom-override-{stamp}"))

util_path.write_text("""// src/utils/forceMovesStartButtonVisibility.js
// Temporary surgical visual override for the Moves Start button.
// This avoids fragile component matching while we identify the exact source component.

const FORCE_ATTR = "data-openshare-start-visibility-forced";

function normalize(value) {
  return String(value || "").replace(/\\s+/g, " ").trim();
}

function isProjectPage() {
  return window.location.pathname.includes("/projects/");
}

function isStartButton(button) {
  const text = normalize(button.textContent);
  const aria = normalize(button.getAttribute("aria-label"));
  const title = normalize(button.getAttribute("title"));

  return text === "Start" || aria === "Start" || title === "Start";
}

function styleStartButton(button) {
  if (!button || button.getAttribute(FORCE_ATTR) === "true") return;
  if (!isProjectPage()) return;
  if (!isStartButton(button)) return;

  button.setAttribute(FORCE_ATTR, "true");

  button.style.setProperty("opacity", "1", "important");
  button.style.setProperty("visibility", "visible", "important");
  button.style.setProperty("color", "#ffffff", "important");
  button.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
  button.style.setProperty("background-color", "#7c3aed", "important");
  button.style.setProperty(
    "background-image",
    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)",
    "important"
  );
  button.style.setProperty("border", "1px solid rgba(196, 181, 253, 0.95)", "important");
  button.style.setProperty(
    "box-shadow",
    "0 14px 34px rgba(124, 58, 237, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.34)",
    "important"
  );
  button.style.setProperty("text-shadow", "0 1px 2px rgba(15, 23, 42, 0.38)", "important");
  button.style.setProperty("min-width", "84px", "important");
  button.style.setProperty("filter", "none", "important");
  button.style.setProperty("mix-blend-mode", "normal", "important");

  button.querySelectorAll("*").forEach((child) => {
    child.style.setProperty("color", "#ffffff", "important");
    child.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
    child.style.setProperty("stroke", "#ffffff", "important");
    child.style.setProperty("opacity", "1", "important");
    child.style.setProperty("filter", "none", "important");
    child.style.setProperty("mix-blend-mode", "normal", "important");
  });
}

function scanForStartButtons() {
  if (typeof document === "undefined") return;

  document.querySelectorAll("button").forEach(styleStartButton);
}

export function forceMovesStartButtonVisibility() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  scanForStartButtons();

  let frame = null;

  const scheduleScan = () => {
    if (frame) return;

    frame = window.requestAnimationFrame(() => {
      frame = null;
      scanForStartButtons();
    });
  };

  const observer = new MutationObserver(scheduleScan);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.addEventListener("popstate", scheduleScan);
  window.addEventListener("hashchange", scheduleScan);
  window.addEventListener("focus", scheduleScan);

  return () => {
    observer.disconnect();
    window.removeEventListener("popstate", scheduleScan);
    window.removeEventListener("hashchange", scheduleScan);
    window.removeEventListener("focus", scheduleScan);

    if (frame) {
      window.cancelAnimationFrame(frame);
    }
  };
}
""")

main_backup = main_path.with_suffix(main_path.suffix + f".backup-before-start-dom-override-{stamp}")
shutil.copy2(main_path, main_backup)

text = main_path.read_text()

import_line = 'import { forceMovesStartButtonVisibility } from "./utils/forceMovesStartButtonVisibility";\n'
call_line = "forceMovesStartButtonVisibility();\n"

if "forceMovesStartButtonVisibility" not in text:
    lines = text.splitlines(True)

    last_import_index = -1
    for i, line in enumerate(lines):
        if line.strip().startswith("import "):
            last_import_index = i

    if last_import_index == -1:
        raise RuntimeError("Could not find import block in main file.")

    lines.insert(last_import_index + 1, import_line)
    lines.insert(last_import_index + 2, "\n" + call_line)

    text = "".join(lines)
else:
    if call_line not in text:
        text = re.sub(
            r'((?:import .+;\n)+)',
            r'\1\n' + call_line,
            text,
            count=1,
        )

main_path.write_text(text)

print("✅ Runtime Start button visibility override installed.")
print(f"Created/updated: {util_path}")
print(f"Patched main:    {main_path}")
print(f"Main backup:     {main_backup}")
print("")
print("Now restart Vite and hard refresh Chrome.")
