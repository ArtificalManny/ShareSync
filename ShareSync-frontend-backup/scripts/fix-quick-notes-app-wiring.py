from pathlib import Path
from shutil import copy2
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
APP = ROOT / "src" / "App.jsx"
BACKUP_DIR = ROOT / ".chatgpt-backups-quick-notes"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

if not APP.exists():
    raise SystemExit(f"Missing file: {APP}")

copy2(APP, BACKUP_DIR / "App.jsx.bak")
text = APP.read_text(encoding="utf-8")

def ensure_once(source: str, old: str, new: str, label: str) -> str:
    if new in source:
        return source
    if old not in source:
        raise RuntimeError(f"Could not find expected marker for {label}")
    return source.replace(old, new, 1)

# 1) Add NotesContext import
text = ensure_once(
    text,
    'import { AuthProvider, useAuth } from "./context/AuthContext";',
    'import { AuthProvider, useAuth } from "./context/AuthContext";\nimport { NotesProvider, useNotes } from "./context/NotesContext";',
    "NotesContext import",
)

# 2) Enable QuickNotesDrawer lazy import
if 'const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));' not in text:
    text = text.replace(
        '// ❌ TEMPORARILY DISABLED - Component has dependency issues\n// const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));',
        'const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));',
        1,
    )

# 3) Add state + notes access inside AppRoutes
marker = '  const [sidebarOpen, setSidebarOpen] = useState(false);'
replacement = (
    '  const [sidebarOpen, setSidebarOpen] = useState(false);\n'
    '  const [quickNotesOpen, setQuickNotesOpen] = useState(false);\n'
    '  const { notes = [] } = useNotes();'
)
text = ensure_once(
    text,
    marker,
    replacement,
    "AppRoutes quick notes state",
)

# 4) Replace Navbar mount and add drawer
old_nav = '          <Navbar user={authUser} onLogout={logout} />'
new_nav = '''          <Navbar
            user={authUser}
            onLogout={logout}
            onOpenQuickNotes={() => setQuickNotesOpen(true)}
            quickNotesCount={notes.length}
          />

          <Suspense fallback={null}>
            <QuickNotesDrawer
              open={quickNotesOpen}
              onClose={() => setQuickNotesOpen(false)}
            />
          </Suspense>'''
text = ensure_once(
    text,
    old_nav,
    new_nav,
    "Navbar quick notes wiring",
)

# 5) Wrap AuthCheck in NotesProvider
old_authcheck = '''                      <div className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0">
                        <AuthCheck />
                      </div>'''
new_authcheck = '''                      <div className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0">
                        <NotesProvider>
                          <AuthCheck />
                        </NotesProvider>
                      </div>'''
text = ensure_once(
    text,
    old_authcheck,
    new_authcheck,
    "NotesProvider wrapper",
)

APP.write_text(text, encoding="utf-8")

print("✅ Patched App.jsx")
print(f"✅ Backup saved to: {BACKUP_DIR / 'App.jsx.bak'}")
print("")
print("Next:")
print("  cd /Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
print("  python3 scripts/fix-quick-notes-app-wiring.py")
print("  npm run dev")
