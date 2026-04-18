from pathlib import Path
from shutil import copy2
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
APP = ROOT / "src" / "App.jsx"
BACKUP_DIR = ROOT / ".chatgpt-backups-quick-notes"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

if not APP.exists():
    raise SystemExit(f"Missing file: {APP}")

copy2(APP, BACKUP_DIR / "App.jsx.bak.v2")
text = APP.read_text(encoding="utf-8")

original = text

def ensure_import():
    global text
    if 'from "./context/NotesContext"' in text:
        return
    pattern = r'import\s+\{\s*AuthProvider,\s*useAuth\s*\}\s+from\s+"\.\/context\/AuthContext";'
    repl = (
        'import { AuthProvider, useAuth } from "./context/AuthContext";\n'
        'import { NotesProvider, useNotes } from "./context/NotesContext";'
    )
    new_text, count = re.subn(pattern, repl, text, count=1)
    if count == 0:
        raise RuntimeError("Could not add NotesContext import")
    text = new_text

def ensure_quick_notes_import():
    global text
    active = 'const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));'
    commented = '// const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));'
    disabled_comment = '// ❌ TEMPORARILY DISABLED - Component has dependency issues'
    if active in text:
        return
    if commented in text:
        text = text.replace(commented, active, 1)
    elif disabled_comment in text and active not in text:
        text = text.replace(
            disabled_comment + "\n// const QuickNotesDrawer = lazy(() => import(\"./components/global/QuickNotesDrawer\"));",
            active,
            1,
        )
    else:
        # add near other lazy imports
        pattern = r'(const\s+\w+\s*=\s*lazy\(\(\)\s*=>\s*import\([^)]+\)\);\n)'
        matches = list(re.finditer(pattern, text))
        if matches:
            last = matches[-1]
            insert_at = last.end()
            text = text[:insert_at] + active + "\n" + text[insert_at:]
        else:
            raise RuntimeError("Could not enable QuickNotesDrawer import")

def ensure_approutes_state():
    global text
    if "quickNotesOpen" in text and "useNotes()" in text:
        return
    pattern = r'(const\s+\[sidebarOpen,\s*setSidebarOpen\]\s*=\s*useState\(false\);)'
    repl = (
        r'\1\n'
        '  const [quickNotesOpen, setQuickNotesOpen] = useState(false);\n'
        '  const { notes = [] } = useNotes();'
    )
    new_text, count = re.subn(pattern, repl, text, count=1)
    if count == 0:
        raise RuntimeError("Could not insert quickNotesOpen state into AppRoutes")
    text = new_text

def ensure_navbar_wiring():
    global text
    if "onOpenQuickNotes={() => setQuickNotesOpen(true)}" in text:
        return

    # Replace a simple self-closing Navbar first
    pattern_simple = r'<Navbar\s+user=\{authUser\}\s+onLogout=\{logout\}\s*/>'
    repl = (
        '<Navbar\n'
        '            user={authUser}\n'
        '            onLogout={logout}\n'
        '            onOpenQuickNotes={() => setQuickNotesOpen(true)}\n'
        '            quickNotesCount={notes.length}\n'
        '          />\n\n'
        '          <Suspense fallback={null}>\n'
        '            <QuickNotesDrawer\n'
        '              open={quickNotesOpen}\n'
        '              onClose={() => setQuickNotesOpen(false)}\n'
        '            />\n'
        '          </Suspense>'
    )
    new_text, count = re.subn(pattern_simple, repl, text, count=1)
    if count > 0:
        text = new_text
        return

    # Replace a more general Navbar opening if needed
    pattern_general = r'<Navbar\b([^>]*)/>'
    match = re.search(pattern_general, text)
    if not match:
        raise RuntimeError("Could not find Navbar mount in App.jsx")

    attrs = match.group(1)
    if "onOpenQuickNotes" not in attrs:
        attrs += '\n            onOpenQuickNotes={() => setQuickNotesOpen(true)}'
    if "quickNotesCount" not in attrs:
        attrs += '\n            quickNotesCount={notes.length}'

    replacement = (
        f'<Navbar{attrs}\n          />\n\n'
        '          <Suspense fallback={null}>\n'
        '            <QuickNotesDrawer\n'
        '              open={quickNotesOpen}\n'
        '              onClose={() => setQuickNotesOpen(false)}\n'
        '            />\n'
        '          </Suspense>'
    )

    start, end = match.span()
    text = text[:start] + replacement + text[end:]

def ensure_notes_provider():
    global text
    if "<NotesProvider>" in text:
        return

    # Most likely case: direct AuthCheck
    pattern_direct = r'(<AuthCheck\s*/>)'
    repl_direct = (
        '<NotesProvider>\n'
        '                          <AuthCheck />\n'
        '                        </NotesProvider>'
    )
    new_text, count = re.subn(pattern_direct, repl_direct, text, count=1)
    if count > 0:
        text = new_text
        return

    raise RuntimeError("Could not wrap AuthCheck with NotesProvider")

ensure_import()
ensure_quick_notes_import()
ensure_approutes_state()
ensure_navbar_wiring()
ensure_notes_provider()

if text == original:
    print("ℹ️ No changes were needed.")
else:
    APP.write_text(text, encoding="utf-8")
    print(f"✅ Patched {APP}")
    print(f"✅ Backup saved to {BACKUP_DIR / 'App.jsx.bak.v2'}")

print("\nVerify with:")
print('grep -n "NotesProvider\\|QuickNotesDrawer\\|quickNotesOpen\\|onOpenQuickNotes\\|quickNotesCount" /Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/App.jsx')
