from pathlib import Path
from datetime import datetime

path = Path("src/components/Sidebar.jsx")
text = path.read_text()

backup = path.with_name(
    f"{path.name}.bak-before-sidebar-clarity-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Darken OpenShare wordmark
old_logo = 'className="text-sm font-bold text-slate-800 tracking-wide whitespace-nowrap animate-in fade-in duration-200"'
new_logo = 'className="openshare-sidebar-wordmark text-sm font-extrabold text-slate-950 tracking-wide whitespace-nowrap animate-in fade-in duration-200"'

if old_logo in text:
    text = text.replace(old_logo, new_logo, 1)
    print("✅ Darkened OpenShare wordmark.")
else:
    print("⚠️ Wordmark class already changed or not found.")

# Add scoped nav class
old_nav = '<nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden pt-2">'
new_nav = '<nav className="openshare-sidebar-nav flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden pt-2">'

if old_nav in text:
    text = text.replace(old_nav, new_nav, 1)
    print("✅ Added openshare-sidebar-nav class.")
else:
    print("⚠️ Nav class already changed or not found.")

# Slightly strengthen divider
text = text.replace(
    '<div className="h-px bg-slate-100" />',
    '<div className="h-px bg-slate-200/80" />',
    1,
)

# Add scoped CSS once
marker = '      {autoHideEnabled && <div className="w-[72px] h-screen shrink-0" aria-hidden="true" />}\n\n'

style_block = '''      {autoHideEnabled && <div className="w-[72px] h-screen shrink-0" aria-hidden="true" />}

      <style>{`
        /* Sidebar clarity pass: darker labels + stronger nav icons */
        #app-sidebar .openshare-sidebar-wordmark {
          color: #0f172a !important;
          font-weight: 800;
        }

        #app-sidebar .openshare-sidebar-nav a,
        #app-sidebar .openshare-sidebar-nav button {
          color: #1e293b !important;
          font-weight: 700;
          opacity: 1 !important;
          text-decoration-color: transparent !important;
        }

        #app-sidebar .openshare-sidebar-nav a span,
        #app-sidebar .openshare-sidebar-nav button span {
          color: #1e293b !important;
          font-weight: 700;
          opacity: 1 !important;
        }

        #app-sidebar .openshare-sidebar-nav svg {
          color: #334155 !important;
          stroke-width: 2.35;
          opacity: 1 !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover,
        #app-sidebar .openshare-sidebar-nav button:hover {
          color: #0f172a !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover span,
        #app-sidebar .openshare-sidebar-nav button:hover span,
        #app-sidebar .openshare-sidebar-nav a:hover svg,
        #app-sidebar .openshare-sidebar-nav button:hover svg {
          color: #0f172a !important;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
        #app-sidebar .openshare-sidebar-nav .active {
          color: #0f172a !important;
          font-weight: 800;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
        #app-sidebar .openshare-sidebar-nav .active span {
          color: #0f172a !important;
          font-weight: 800;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"] svg,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"] svg,
        #app-sidebar .openshare-sidebar-nav .active svg {
          color: #111827 !important;
          stroke-width: 2.65;
        }

        @media (prefers-color-scheme: dark) {
          #app-sidebar .openshare-sidebar-wordmark {
            color: #f8fafc !important;
          }

          #app-sidebar .openshare-sidebar-nav a,
          #app-sidebar .openshare-sidebar-nav button,
          #app-sidebar .openshare-sidebar-nav a span,
          #app-sidebar .openshare-sidebar-nav button span {
            color: #e5e7eb !important;
          }

          #app-sidebar .openshare-sidebar-nav svg {
            color: #cbd5e1 !important;
          }
        }
      `}</style>

'''

if "Sidebar clarity pass: darker labels + stronger nav icons" not in text:
    if marker not in text:
        raise SystemExit("❌ Could not find insertion marker. No changes written.")
    text = text.replace(marker, style_block, 1)
    print("✅ Added scoped sidebar clarity CSS.")
else:
    print("⚠️ Sidebar clarity CSS already exists.")

path.write_text(text)

print("")
print("Inspect:")
print('rg -n "openshare-sidebar-wordmark|openshare-sidebar-nav|Sidebar clarity pass" src/components/Sidebar.jsx -C 4')
print("")
print("Then run:")
print("npm run build")
