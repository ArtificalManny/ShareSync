from pathlib import Path
from datetime import datetime

path = Path("src/components/Sidebar.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-sidebar-visual-strike-safe-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

start_marker = "      <style>{`"
end_marker = "      `}</style>"

if start_marker not in text:
    raise RuntimeError("Could not find Sidebar style start. No changes were written.")

start = text.index(start_marker)
end = text.index(end_marker, start) + len(end_marker)

new_style = r'''      <style>{`
        /* Sidebar visual strike SAFE PASS
           CSS-only. Does not touch width, fixed position, auto-hide, localStorage, or routing.
        */

        #app-sidebar {
          background:
            radial-gradient(circle at 24% 10%, rgba(139, 92, 246, 0.12), transparent 34%),
            radial-gradient(circle at 82% 28%, rgba(34, 211, 238, 0.10), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92)) !important;
          border-right-color: rgba(203, 213, 225, 0.86) !important;
          box-shadow: 18px 0 50px rgba(15, 23, 42, 0.07);
        }

        #app-sidebar .openshare-sidebar-wordmark {
          color: #0f172a !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em;
        }

        #app-sidebar .openshare-sidebar-nav a,
        #app-sidebar .openshare-sidebar-nav button {
          color: #334155 !important;
          font-weight: 800 !important;
          opacity: 1 !important;
          border-radius: 20px !important;
          text-decoration-color: transparent !important;
          transition:
            transform 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease,
            border-color 180ms ease !important;
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
          color: #0f172a !important;
          transform: translateX(2px);
          background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(245,243,255,0.88)) !important;
          box-shadow:
            0 14px 30px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.85) !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover svg,
        #app-sidebar .openshare-sidebar-nav button:hover svg {
          color: #7c3aed !important;
          transform: scale(1.08);
          filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.22));
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
        #app-sidebar .openshare-sidebar-nav .active {
          color: #0f172a !important;
          font-weight: 950 !important;
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.96)) !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 16px 36px rgba(139, 92, 246, 0.16),
            0 0 0 4px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.95) !important;
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
          filter: drop-shadow(0 0 12px rgba(124, 58, 237, 0.24));
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"]::before,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"]::before,
        #app-sidebar .openshare-sidebar-nav .active::before {
          content: "";
          position: absolute;
          left: -8px;
          top: 50%;
          width: 4px;
          height: 34px;
          border-radius: 999px;
          transform: translateY(-50%);
          background: linear-gradient(180deg, #8b5cf6, #22d3ee);
          box-shadow: 0 0 18px rgba(139, 92, 246, 0.55);
        }

        #app-sidebar [title="Focus Next Mission"] {
          border-radius: 18px !important;
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.94)) !important;
          border-color: rgba(196, 181, 253, 0.95) !important;
          color: #6d28d9 !important;
          box-shadow:
            0 14px 32px rgba(139, 92, 246, 0.14),
            inset 0 1px 0 rgba(255,255,255,0.95) !important;
        }

        #app-sidebar [title="Focus Next Mission"]:hover {
          transform: translateY(-1px);
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%) !important;
          color: #ffffff !important;
          box-shadow:
            0 18px 42px rgba(124, 58, 237, 0.32),
            inset 0 1px 0 rgba(255,255,255,0.34) !important;
        }

        #app-sidebar [title="Focus Next Mission"]:hover svg,
        #app-sidebar [title="Focus Next Mission"]:hover span {
          color: #ffffff !important;
        }

        @media (prefers-color-scheme: dark) {
          #app-sidebar {
            background:
              radial-gradient(circle at 24% 10%, rgba(139, 92, 246, 0.15), transparent 36%),
              radial-gradient(circle at 82% 28%, rgba(34, 211, 238, 0.09), transparent 36%),
              linear-gradient(180deg, rgba(10,13,24,0.98), rgba(8,12,22,0.96)) !important;
            border-right-color: rgba(255,255,255,0.08) !important;
            box-shadow: 18px 0 50px rgba(0, 0, 0, 0.22);
          }

          #app-sidebar .openshare-sidebar-wordmark {
            color: #f8fafc !important;
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
            background: linear-gradient(135deg, rgba(30,41,59,0.88), rgba(76,29,149,0.24)) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
          #app-sidebar .openshare-sidebar-nav .active {
            color: #ffffff !important;
            background: linear-gradient(135deg, rgba(30,41,59,0.96), rgba(76,29,149,0.34)) !important;
            border-color: rgba(167, 139, 250, 0.38) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
          #app-sidebar .openshare-sidebar-nav .active span {
            color: #ffffff !important;
          }
        }
      `}</style>'''

text = text[:start] + new_style + text[end:]

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in text:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. No changes were written.")

path.write_text(text)

print("Safe Sidebar visual strike patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Scoped CSS inside src/components/Sidebar.jsx")
print("")
print("Did NOT change:")
print("- aside className")
print("- fixed positioning")
print("- width/collapsed logic")
print("- auto-hide behavior")
print("- localStorage behavior")
print("- routes/nav labels")
