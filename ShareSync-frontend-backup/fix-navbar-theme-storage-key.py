from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/Navbar.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(f"{path.name}.backup-before-ss-theme-sync-{timestamp}")
shutil.copy2(path, backup)

text = path.read_text()

old_stored = '''    const storedTheme =
      window.localStorage.getItem("theme") ||
      window.localStorage.getItem("openShareTheme") ||
      window.localStorage.getItem("sharesync-theme");'''

new_stored = '''    const storedTheme =
      window.localStorage.getItem("ss.theme") ||
      window.localStorage.getItem("theme") ||
      window.localStorage.getItem("openShareTheme") ||
      window.localStorage.getItem("sharesync-theme");'''

if old_stored not in text:
    raise RuntimeError(
        "Could not find the Navbar storedTheme block. Run:\n"
        "grep -n -B 4 -A 8 'const storedTheme' src/components/Navbar.jsx"
    )

text = text.replace(old_stored, new_stored, 1)

old_write = '''    root.classList.toggle("dark", nextTheme === "dark");
    root.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    setDetectedDarkMode(nextTheme === "dark");

    try {
      window.dispatchEvent(new CustomEvent("theme:toggled", { detail: { theme: nextTheme } }));
    } catch {}'''

new_write = '''    root.classList.toggle("dark", nextTheme === "dark");
    root.setAttribute("data-theme", nextTheme);

    if (document.body) {
      document.body.dataset.theme = nextTheme;
      document.body.style.backgroundColor =
        nextTheme === "dark" ? "#09090B" : "#F8FAFC";
    }

    // Keep the new Settings.jsx source of truth and older legacy keys synced.
    window.localStorage.setItem("ss.theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    window.localStorage.setItem("openShareTheme", nextTheme);
    window.localStorage.setItem("sharesync-theme", nextTheme);

    setDetectedDarkMode(nextTheme === "dark");

    try {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("theme:toggled", { detail: { theme: nextTheme } }));
    } catch {}'''

if old_write not in text:
    raise RuntimeError(
        "Could not find the Navbar theme write block. Run:\n"
        "grep -n -B 8 -A 16 'window.localStorage.setItem(\"theme\", nextTheme)' src/components/Navbar.jsx"
    )

text = text.replace(old_write, new_write, 1)

path.write_text(text)

print("✅ Navbar theme storage sync applied.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Changed:")
print("- Navbar now reads ss.theme first")
print("- Navbar now writes ss.theme when toggling dark/light mode")
print("- Legacy keys are kept synced so older components do not break")
print("- document.body background is also synced for Settings.jsx")
