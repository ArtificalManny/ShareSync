from pathlib import Path
from shutil import copy2
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
APP_PATH = ROOT / "src" / "App.jsx"

if not APP_PATH.exists():
    raise SystemExit(f"Missing file: {APP_PATH}")

text = APP_PATH.read_text(encoding="utf-8")

backup_dir = ROOT / ".chatgpt-backups-quick-notes"
backup_dir.mkdir(parents=True, exist_ok=True)
copy2(APP_PATH, backup_dir / "App.jsx.bak")

def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old in source:
        return source.replace(old, new, 1)
    if new in source:
        return source
    raise RuntimeError(f"Could not find expected marker for {label}")

text = replace_once(
    text,
    'import { AuthProvider, useAuth } from "./context/AuthContext";',
    'import { AuthProvider, useAuth } from "./context/AuthContext";\nimport { NotesProvider, useNotes } from "./context/NotesContext";',
    "NotesContext import",
)

text = replace_once(
    text,
    '// ❌ TEMPORARILY DISABLED - Component has dependency issues\n// const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));',
    'const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));',
    "QuickNotesDrawer lazy import",
)

text = replace_once(
    text,
    '  const [sidebarOpen, setSidebarOpen] = useState(false);',
    '  const [sidebarOpen, setSidebarOpen] = useState(false);\n  const [quickNotesOpen, setQuickNotesOpen] = useState(false);\n  const { notes = [] } = useNotes();',
    "AppRoutes state block",
)

text = replace_once(
    text,
    '          <Navbar user={authUser} onLogout={logout} />',
    '          <Navbar\n            user={authUser}\n            onLogout={logout}\n            onOpenQuickNotes={() => setQuickNotesOpen(true)}\n            quickNotesCount={notes.length}\n          />\n\n          <Suspense fallback={null}>\n            <QuickNotesDrawer\n              open={quickNotesOpen}\n              onClose={() => setQuickNotesOpen(false)}\n            />\n          </Suspense>',
    "Navbar Quick Notes wiring",
)

text = replace_once(
    text,
    '                      <div className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0">\n                        <AuthCheck />\n                      </div>',
    '                      <div className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0">\n                        <NotesProvider>\n                          <AuthCheck />\n                        </NotesProvider>\n                      </div>',
    "NotesProvider wrapper",
)

APP_PATH.write_text(text, encoding="utf-8")

print("✅ Patched App.jsx")
print(f"✅ Backup saved to: {backup_dir / 'App.jsx.bak'}")
print("")
print("Next:")
print("  cd /Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
print("  python3 scripts/fix-quick-notes-layout-control.py")
print("  npm run dev")
