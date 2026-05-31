from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/components/Sidebar.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/components/Sidebar.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-sidebar-wordmark-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# Add a scoped lockup class to the logo + wordmark wrapper.
brand_zone = text.find('className="sidebar-brand-zone')
if brand_zone == -1:
    raise RuntimeError("Could not find sidebar-brand-zone.")

wrapper_start = text.find('className="flex items-center gap-2.5"', brand_zone)

if wrapper_start != -1 and "openshare-sidebar-lockup" not in text[wrapper_start:wrapper_start + 140]:
    text = (
        text[:wrapper_start]
        + text[wrapper_start:].replace(
            'className="flex items-center gap-2.5"',
            'className="openshare-sidebar-lockup flex items-center gap-2.5 select-none"',
            1,
        )
    )

# Add select-none to the OpenShare wordmark className.
wordmark_pattern = r'className="openshare-sidebar-wordmark([^"]*)"'

def add_select_none(match):
    classes = match.group(1)
    if "select-none" in classes:
        return match.group(0)
    return f'className="openshare-sidebar-wordmark select-none{classes}"'

text = re.sub(wordmark_pattern, add_select_none, text, count=1)

# Remove older version if rerunning.
text = re.sub(
    r"\n\s*/\* Sidebar OpenShare wordmark clarity fix[\s\S]*?/\* END Sidebar OpenShare wordmark clarity fix \*/\n?",
    "\n",
    text,
)

css_patch = r'''
        /* Sidebar OpenShare wordmark clarity fix
           Fixes the selected/highlighted-looking OpenShare text in the sidebar.
           Styling only. No sidebar state, routing, auto-hide, or auth logic changes.
        */

        #app-sidebar .openshare-sidebar-lockup,
        #app-sidebar .openshare-sidebar-wordmark {
          -webkit-user-select: none !important;
          user-select: none !important;
        }

        #app-sidebar .openshare-sidebar-wordmark {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 28px !important;
          padding: 0.16rem 0.48rem !important;
          border-radius: 999px !important;
          color: #0f172a !important;
          -webkit-text-fill-color: currentColor !important;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(245, 243, 255, 0.50)) !important;
          border: 1px solid rgba(196, 181, 253, 0.30) !important;
          box-shadow:
            0 8px 20px rgba(15, 23, 42, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          text-decoration: none !important;
          text-decoration-color: transparent !important;
          line-height: 1 !important;
        }

        #app-sidebar .openshare-sidebar-wordmark::selection {
          background: transparent !important;
          color: inherit !important;
          -webkit-text-fill-color: currentColor !important;
        }

        html.dark #app-sidebar .openshare-sidebar-wordmark,
        html[data-theme="dark"] #app-sidebar .openshare-sidebar-wordmark,
        .dark #app-sidebar .openshare-sidebar-wordmark,
        [data-theme="dark"] #app-sidebar .openshare-sidebar-wordmark {
          color: #f8fafc !important;
          -webkit-text-fill-color: currentColor !important;
          background:
            linear-gradient(135deg, rgba(139, 92, 246, 0.20), rgba(34, 211, 238, 0.10)) !important;
          border-color: rgba(167, 139, 250, 0.30) !important;
          text-shadow: 0 0 18px rgba(139, 92, 246, 0.24) !important;
          box-shadow:
            0 10px 28px rgba(0, 0, 0, 0.26),
            0 0 22px rgba(139, 92, 246, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        }

        @media (prefers-color-scheme: dark) {
          #app-sidebar .openshare-sidebar-wordmark {
            color: #f8fafc !important;
            -webkit-text-fill-color: currentColor !important;
            background:
              linear-gradient(135deg, rgba(139, 92, 246, 0.20), rgba(34, 211, 238, 0.10)) !important;
            border-color: rgba(167, 139, 250, 0.30) !important;
            text-shadow: 0 0 18px rgba(139, 92, 246, 0.24) !important;
          }
        }

        /* END Sidebar OpenShare wordmark clarity fix */
'''

close_marker = "      `}</style>"

if close_marker not in text:
    shutil.copy2(backup, path)
    raise RuntimeError("Could not find Sidebar inline style closing marker. Original restored.")

text = text.replace(close_marker, css_patch + "\n\n" + close_marker, 1)

unsafe_patterns = [
    ("onClick={() =", "malformed onClick arrow"),
    ("className={className={", "double className corruption"),
]

for pattern, label in unsafe_patterns:
    if pattern in text:
        shutil.copy2(backup, path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "Sidebar OpenShare wordmark clarity fix" not in text:
    shutil.copy2(backup, path)
    raise RuntimeError("Patch failed. Missing wordmark CSS marker. Original restored.")

path.write_text(text)

print("Sidebar OpenShare wordmark fix applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Added openshare-sidebar-lockup to the brand wrapper when possible")
print("- Added select-none to the OpenShare wordmark")
print("- Added scoped CSS so the wordmark no longer looks accidentally highlighted")
print("- Improved light/dark readability for the sidebar wordmark")
print("")
print("No backend files touched.")
print("No routing changed.")
print("No sidebar auto-hide logic changed.")
print("No user/avatar logic changed.")
