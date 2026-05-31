from pathlib import Path
from datetime import datetime

path = Path("src/components/Sidebar.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-sidebar-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

old_style_start = '      <style>{`'
old_style_end = '      `}</style>'

if old_style_start not in text:
    raise RuntimeError("Could not find Sidebar style start. No changes were written.")

start = text.index(old_style_start)
end = text.index(old_style_end, start) + len(old_style_end)

new_style = r'''      <style>{`
        /* OpenShare Sidebar visual strike pass — scoped only to #app-sidebar */
        #app-sidebar {
          --os-sidebar-ink: #0f172a;
          --os-sidebar-muted: #64748b;
          --os-sidebar-line: rgba(148, 163, 184, 0.22);
          --os-sidebar-glow: rgba(139, 92, 246, 0.18);
          --os-sidebar-cyan: rgba(34, 211, 238, 0.14);
          --os-sidebar-emerald: rgba(16, 185, 129, 0.12);
          color: var(--os-sidebar-ink);
        }

        #app-sidebar::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 20% 12%, var(--os-sidebar-glow), transparent 34%),
            radial-gradient(circle at 82% 28%, var(--os-sidebar-cyan), transparent 34%),
            radial-gradient(circle at 28% 92%, var(--os-sidebar-emerald), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.86));
          z-index: -1;
        }

        #app-sidebar::after {
          content: "";
          position: absolute;
          top: 0;
          right: -1px;
          width: 1px;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(139, 92, 246, 0.45),
            rgba(34, 211, 238, 0.34),
            rgba(16, 185, 129, 0.28),
            transparent
          );
        }

        #app-sidebar .openshare-sidebar-wordmark {
          color: #0f172a !important;
          font-weight: 900 !important;
          letter-spacing: -0.015em;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.65);
        }

        #app-sidebar .openshare-sidebar-nav {
          position: relative;
        }

        #app-sidebar .openshare-sidebar-nav a,
        #app-sidebar .openshare-sidebar-nav button {
          position: relative;
          color: #334155 !important;
          font-weight: 800 !important;
          opacity: 1 !important;
          border-radius: 20px !important;
          min-height: 54px;
          text-decoration-color: transparent !important;
          transition:
            transform 180ms ease,
            background 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease !important;
        }

        #app-sidebar .openshare-sidebar-nav a span,
        #app-sidebar .openshare-sidebar-nav button span {
          color: inherit !important;
          font-weight: 850 !important;
          opacity: 1 !important;
        }

        #app-sidebar .openshare-sidebar-nav svg {
          color: #475569 !important;
          stroke-width: 2.45 !important;
          opacity: 1 !important;
          transition: transform 180ms ease, color 180ms ease, filter 180ms ease;
        }

        #app-sidebar .openshare-sidebar-nav a:hover,
        #app-sidebar .openshare-sidebar-nav button:hover {
          color: #111827 !important;
          transform: translateX(2px);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.92), rgba(245,243,255,0.78)) !important;
          box-shadow:
            0 14px 30px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        #app-sidebar .openshare-sidebar-nav a:hover svg,
        #app-sidebar .openshare-sidebar-nav button:hover svg {
          color: #7c3aed !important;
          transform: scale(1.08);
          filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.20));
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
        #app-sidebar .openshare-sidebar-nav .active {
          color: #0f172a !important;
          font-weight: 950 !important;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.96)) !important;
          border: 1px solid rgba(196, 181, 253, 0.92) !important;
          box-shadow:
            0 16px 36px rgba(139, 92, 246, 0.15),
            0 0 0 4px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"]::before,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"]::before,
        #app-sidebar .openshare-sidebar-nav .active::before {
          content: "";
          position: absolute;
          left: -10px;
          top: 50%;
          width: 4px;
          height: 34px;
          border-radius: 999px;
          transform: translateY(-50%);
          background: linear-gradient(180deg, #8b5cf6, #22d3ee);
          box-shadow: 0 0 18px rgba(139, 92, 246, 0.55);
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
        #app-sidebar .openshare-sidebar-nav .active span {
          color: #0f172a !important;
          font-weight: 950 !important;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"] svg,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"] svg,
        #app-sidebar .openshare-sidebar-nav .active svg {
          color: #7c3aed !important;
          stroke-width: 2.8 !important;
          filter: drop-shadow(0 0 12px rgba(124, 58, 237, 0.22));
        }

        #app-sidebar [title="Focus Next Mission"] {
          min-height: 46px;
          border-radius: 18px !important;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.95)) !important;
          border-color: rgba(196, 181, 253, 0.9) !important;
          color: #6d28d9 !important;
          box-shadow:
            0 14px 32px rgba(139, 92, 246, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar [title="Focus Next Mission"]:hover {
          transform: translateY(-1px);
          background:
            linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%) !important;
          color: #ffffff !important;
          box-shadow:
            0 18px 42px rgba(124, 58, 237, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
        }

        #app-sidebar [title="Focus Next Mission"]:hover svg,
        #app-sidebar [title="Focus Next Mission"]:hover span {
          color: #ffffff !important;
        }

        @media (prefers-color-scheme: dark) {
          #app-sidebar {
            --os-sidebar-ink: #f8fafc;
            --os-sidebar-muted: #94a3b8;
            --os-sidebar-line: rgba(255, 255, 255, 0.08);
            --os-sidebar-glow: rgba(139, 92, 246, 0.18);
            --os-sidebar-cyan: rgba(34, 211, 238, 0.10);
            --os-sidebar-emerald: rgba(16, 185, 129, 0.08);
          }

          #app-sidebar::before {
            background:
              radial-gradient(circle at 20% 12%, var(--os-sidebar-glow), transparent 36%),
              radial-gradient(circle at 82% 28%, var(--os-sidebar-cyan), transparent 36%),
              radial-gradient(circle at 28% 92%, var(--os-sidebar-emerald), transparent 36%),
              linear-gradient(180deg, rgba(10, 13, 24, 0.98), rgba(8, 12, 22, 0.96));
          }

          #app-sidebar .openshare-sidebar-wordmark {
            color: #f8fafc !important;
            text-shadow: 0 0 20px rgba(139, 92, 246, 0.20);
          }

          #app-sidebar .openshare-sidebar-nav a,
          #app-sidebar .openshare-sidebar-nav button,
          #app-sidebar .openshare-sidebar-nav a span,
          #app-sidebar .openshare-sidebar-nav button span {
            color: #dbeafe !important;
          }

          #app-sidebar .openshare-sidebar-nav svg {
            color: #cbd5e1 !important;
          }

          #app-sidebar .openshare-sidebar-nav a:hover,
          #app-sidebar .openshare-sidebar-nav button:hover {
            color: #ffffff !important;
            background:
              linear-gradient(135deg, rgba(30, 41, 59, 0.86), rgba(76, 29, 149, 0.22)) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
          #app-sidebar .openshare-sidebar-nav .active {
            color: #ffffff !important;
            background:
              linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(76, 29, 149, 0.34)) !important;
            border-color: rgba(167, 139, 250, 0.35) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.35),
              0 0 0 4px rgba(139, 92, 246, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
          #app-sidebar .openshare-sidebar-nav .active span {
            color: #ffffff !important;
          }
        }
      `}</style>'''

text = text[:start] + new_style + text[end:]

old_aside = """          bg-white border-r border-slate-200
          transition-all duration-300 ease-out"""

new_aside = """          relative overflow-hidden
          bg-white/88 border-r border-slate-200/80 backdrop-blur-2xl
          transition-all duration-300 ease-out"""

if old_aside not in text:
    raise RuntimeError("Could not find Sidebar shell class block. Style was not written.")

text = text.replace(old_aside, new_aside, 1)

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in text:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

path.write_text(text)

print("Sidebar visual strike patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Scoped CSS inside src/components/Sidebar.jsx")
print("- Sidebar shell visual classes")
print("")
print("No backend files were touched.")
print("No routing was changed.")
print("No auto-hide behavior was changed.")
print("No localStorage behavior was changed.")
print("No nav items or labels were changed.")
