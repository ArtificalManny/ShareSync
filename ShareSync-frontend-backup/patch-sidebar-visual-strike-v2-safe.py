from pathlib import Path
from datetime import datetime

path = Path("src/components/Sidebar.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-sidebar-visual-strike-v2-safe-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

# 1) Replace ONLY the existing scoped <style> block.
start_marker = "      <style>{`"
end_marker = "      `}</style>"

if start_marker not in text:
    raise RuntimeError("Could not find Sidebar <style> start. No changes were written.")

start = text.index(start_marker)
end = text.index(end_marker, start) + len(end_marker)

new_style = r'''      <style>{`
        /* OpenShare Sidebar visual strike v2
           Safe pass: styling only. No routing, no state, no auto-hide logic changes.
        */

        #app-sidebar {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateX(0) !important;
          translate: 0 0 !important;
          left: 0 !important;
          z-index: 80 !important;

          background:
            radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.16), transparent 32%),
            radial-gradient(circle at 86% 26%, rgba(34, 211, 238, 0.12), transparent 34%),
            radial-gradient(circle at 24% 88%, rgba(16, 185, 129, 0.10), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)) !important;

          border-right: 1px solid rgba(203, 213, 225, 0.92) !important;
          box-shadow:
            22px 0 60px rgba(15, 23, 42, 0.08),
            inset -1px 0 0 rgba(255, 255, 255, 0.9) !important;
        }

        #app-sidebar > * {
          visibility: visible !important;
          opacity: 1 !important;
        }

        #app-sidebar .sidebar-brand-zone {
          position: relative;
        }

        #app-sidebar .sidebar-brand-zone::after {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 8px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(139, 92, 246, 0.28),
            rgba(34, 211, 238, 0.22),
            transparent
          );
        }

        #app-sidebar .openshare-sidebar-wordmark {
          color: #0f172a !important;
          font-weight: 950 !important;
          letter-spacing: -0.02em !important;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        #app-sidebar .openshare-sidebar-nav {
          padding-top: 0.65rem !important;
        }

        #app-sidebar .openshare-sidebar-nav a,
        #app-sidebar .openshare-sidebar-nav button {
          position: relative !important;
          min-height: 52px;
          border-radius: 22px !important;
          color: #334155 !important;
          font-weight: 850 !important;
          opacity: 1 !important;
          border: 1px solid transparent !important;
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
          font-weight: 900 !important;
          opacity: 1 !important;
        }

        #app-sidebar .openshare-sidebar-nav svg {
          color: #475569 !important;
          stroke-width: 2.45 !important;
          opacity: 1 !important;
          transition:
            transform 180ms ease,
            color 180ms ease,
            filter 180ms ease !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover,
        #app-sidebar .openshare-sidebar-nav button:hover {
          color: #0f172a !important;
          transform: translateX(2px);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(245, 243, 255, 0.88)) !important;
          border-color: rgba(196, 181, 253, 0.62) !important;
          box-shadow:
            0 16px 34px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover svg,
        #app-sidebar .openshare-sidebar-nav button:hover svg {
          color: #7c3aed !important;
          transform: scale(1.08);
          filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.24));
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
        #app-sidebar .openshare-sidebar-nav .active {
          color: #0f172a !important;
          font-weight: 950 !important;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(245, 243, 255, 0.96)) !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 18px 42px rgba(139, 92, 246, 0.17),
            0 0 0 4px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"]::before,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"]::before,
        #app-sidebar .openshare-sidebar-nav .active::before {
          content: "";
          position: absolute;
          left: -9px;
          top: 50%;
          width: 4px;
          height: 34px;
          border-radius: 999px;
          transform: translateY(-50%);
          background: linear-gradient(180deg, #8b5cf6 0%, #22d3ee 100%);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
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
          filter: drop-shadow(0 0 13px rgba(124, 58, 237, 0.28));
        }

        #app-sidebar .sidebar-telemetry-card {
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.86)) !important;
          border-color: rgba(226, 232, 240, 0.9) !important;
          border-radius: 20px !important;
          box-shadow:
            0 14px 34px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
        }

        #app-sidebar .sidebar-team-hud {
          margin-left: 0.75rem;
          margin-right: 0.75rem;
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(240, 253, 250, 0.42));
          border: 1px solid rgba(203, 213, 225, 0.52);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        #app-sidebar .sidebar-catalyst-button {
          min-height: 46px;
          border-radius: 18px !important;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(245, 243, 255, 0.94)) !important;
          border-color: rgba(196, 181, 253, 0.95) !important;
          color: #6d28d9 !important;
          box-shadow:
            0 16px 34px rgba(139, 92, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .sidebar-catalyst-button span,
        #app-sidebar .sidebar-catalyst-button svg {
          color: #6d28d9 !important;
        }

        #app-sidebar .sidebar-catalyst-button:hover {
          transform: translateY(-1px);
          background:
            linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          border-color: rgba(221, 214, 254, 0.95) !important;
          color: #ffffff !important;
          box-shadow:
            0 20px 44px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
        }

        #app-sidebar .sidebar-catalyst-button:hover span,
        #app-sidebar .sidebar-catalyst-button:hover svg {
          color: #ffffff !important;
        }

        @media (prefers-color-scheme: dark) {
          #app-sidebar {
            background:
              radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 86% 26%, rgba(34, 211, 238, 0.10), transparent 36%),
              radial-gradient(circle at 24% 88%, rgba(16, 185, 129, 0.08), transparent 36%),
              linear-gradient(180deg, rgba(8, 12, 22, 0.99), rgba(10, 13, 24, 0.97)) !important;
            border-right-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow: 22px 0 60px rgba(0, 0, 0, 0.32) !important;
          }

          #app-sidebar .openshare-sidebar-wordmark {
            color: #f8fafc !important;
            text-shadow: 0 0 18px rgba(139, 92, 246, 0.26);
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
              linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(76, 29, 149, 0.26)) !important;
            border-color: rgba(167, 139, 250, 0.28) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
          #app-sidebar .openshare-sidebar-nav .active {
            color: #ffffff !important;
            background:
              linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(76, 29, 149, 0.38)) !important;
            border-color: rgba(167, 139, 250, 0.42) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.38),
              0 0 0 4px rgba(139, 92, 246, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
          #app-sidebar .openshare-sidebar-nav .active span {
            color: #ffffff !important;
          }

          #app-sidebar .sidebar-telemetry-card,
          #app-sidebar .sidebar-team-hud {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.52)) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }
        }
      `}</style>'''

text = text[:start] + new_style + text[end:]

# 2) Add tiny class hooks. These do not alter behavior.
replacements = [
    (
        '<div className="flex justify-center mt-2 mb-4 relative" title={statusText}>',
        '<div className="sidebar-telemetry-collapsed flex justify-center mt-2 mb-4 relative" title={statusText}>',
    ),
    (
        '<div className="px-3 py-3 mx-3 mb-2 bg-slate-50 dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">',
        '<div className="sidebar-telemetry-card px-3 py-3 mx-3 mb-2 bg-slate-50 dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">',
    ),
    (
        '<div className="px-4 py-2 mb-3">',
        '<div className="sidebar-team-hud px-4 py-2 mb-3">',
    ),
    (
        '<button\n        className={`\n          w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
        '<button\n        className={`\n          sidebar-catalyst-button w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
    ),
    (
        '<div className="flex items-center justify-center p-4 pt-6 pb-6">',
        '<div className="sidebar-brand-zone flex items-center justify-center p-4 pt-6 pb-6">',
    ),
]

for old, new in replacements:
    if new in text:
        continue
    if old not in text:
        raise RuntimeError(f"Could not find expected class hook target: {old[:80]}...")
    text = text.replace(old, new, 1)

bad_patterns = [
    "onClick={() =",
    "className={` =",
    "className={ =",
]

for bad in bad_patterns:
    if bad in text:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. No changes were written.")

path.write_text(text)

print("Sidebar visual strike v2 safe patch applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Replaced scoped Sidebar CSS")
print("- Added visual-only class hooks")
print("")
print("Did NOT change:")
print("- auto-hide logic")
print("- localStorage logic")
print("- routing")
print("- nav labels")
print("- backend files")
