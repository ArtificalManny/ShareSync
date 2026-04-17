#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BACKUP_ROOT = ROOT / ".chatgpt-backups-global-dark-canvas" / datetime.now().strftime("%Y%m%d-%H%M%S")

APP_PATH = ROOT / "src/App.jsx"
INDEX_PATH = ROOT / "src/index.css"
THEME_ESCAPE_PATH = ROOT / "src/styles/theme-escape-hatch.css"
LAYOUT_SKIN_PATH = ROOT / "src/components/LayoutSkin.jsx"

FILES_TO_BACKUP = [APP_PATH, INDEX_PATH, THEME_ESCAPE_PATH, LAYOUT_SKIN_PATH]


def backup_file(path: Path) -> None:
    rel = path.relative_to(ROOT)
    dst = BACKUP_ROOT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dst)


def require_contains(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise RuntimeError(f"Could not find expected marker for {label!r}: {needle!r}")


def patch_app() -> None:
    text = APP_PATH.read_text(encoding="utf-8")

    import_line = 'import "./styles/theme-escape-hatch.css";'
    anchor_import = 'import "./styles/status-colors.css";'

    if import_line not in text:
        require_contains(text, anchor_import, "App.jsx theme escape import anchor")
        text = text.replace(anchor_import, anchor_import + "\n" + import_line, 1)

    router_open = "<Router>"
    theme_sync_line = "                  <ThemeSync />"
    if theme_sync_line not in text:
        require_contains(text, router_open, "App.jsx ThemeSync mount anchor")
        text = text.replace(router_open, router_open + "\n" + theme_sync_line, 1)

    old_container = 'className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0"'
    new_container = 'className="app-container w-full min-h-screen transition-colors duration-300 !rounded-none !m-0 !p-0 !border-0"'
    require_contains(text, old_container, "App.jsx app-container class")
    text = text.replace(old_container, new_container, 1)

    APP_PATH.write_text(text, encoding="utf-8")


def patch_index() -> None:
    text = INDEX_PATH.read_text(encoding="utf-8")

    old_html_scheme = "  /* CHANGED: Force light mode for \"The Gallery Walk\" */\n  color-scheme: light;"
    new_html_scheme = "  /* Allow both schemes; final choice is controlled by ThemeSync + theme-escape-hatch */\n  color-scheme: light dark;"
    require_contains(text, old_html_scheme, "index.css html color-scheme")
    text = text.replace(old_html_scheme, new_html_scheme, 1)

    old_tail = """html, body {
  color-scheme: light !important;
}

input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #0f172a !important;
}"""

    new_tail = """html:not(.dark),
html[data-theme="light"] {
  color-scheme: light !important;
}

html.dark,
html[data-theme="dark"] {
  color-scheme: dark !important;
}

html:not(.dark) input:-webkit-autofill,
html:not(.dark) input:-webkit-autofill:hover,
html:not(.dark) input:-webkit-autofill:focus,
html:not(.dark) input:-webkit-autofill:active,
html[data-theme="light"] input:-webkit-autofill,
html[data-theme="light"] input:-webkit-autofill:hover,
html[data-theme="light"] input:-webkit-autofill:focus,
html[data-theme="light"] input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: #0f172a !important;
}

html.dark input:-webkit-autofill,
html.dark input:-webkit-autofill:hover,
html.dark input:-webkit-autofill:focus,
html.dark input:-webkit-autofill:active,
html[data-theme="dark"] input:-webkit-autofill,
html[data-theme="dark"] input:-webkit-autofill:hover,
html[data-theme="dark"] input:-webkit-autofill:focus,
html[data-theme="dark"] input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #18181B inset !important;
  -webkit-text-fill-color: #F5F5F7 !important;
  caret-color: #F5F5F7 !important;
}"""

    require_contains(text, old_tail, "index.css forced light tail block")
    text = text.replace(old_tail, new_tail, 1)

    INDEX_PATH.write_text(text, encoding="utf-8")


def main() -> None:
    for path in FILES_TO_BACKUP:
      if not path.exists():
          raise FileNotFoundError(f"Missing expected file: {path}")
      backup_file(path)

    patch_app()
    patch_index()

    print("✅ patched src/App.jsx")
    print("✅ patched src/index.css")
    print("")
    print("Backups saved to:")
    print(f"  {BACKUP_ROOT}")
    print("")
    print("Next:")
    print(f"  cd {ROOT}")
    print("  npm run dev")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"❌ {exc}", file=sys.stderr)
        sys.exit(1)
