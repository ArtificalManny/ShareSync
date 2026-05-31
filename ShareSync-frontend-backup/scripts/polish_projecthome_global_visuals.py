from pathlib import Path
import re
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_name(
    f"ProjectHome.jsx.bak-before-global-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

changed = 0

# 1) Hide the active-project "Ship Update" button, but keep Complete/Reopen lifecycle actions.
old = """{canUseMemberActions ? (
            <button
              onClick={handlePrimaryAction}"""

new = """{canUseMemberActions && (isCompleted || isReadyToClose) ? (
            <button
              onClick={handlePrimaryAction}"""

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
else:
    print("⚠️ Could not find the primary action button gate. It may already be changed.")

# 2) Polish ProjectHeader shell visually without changing project data/functions.
old = '''<header className="px-10 py-6 border-b border-slate-200/60 bg-slate-50 dark:bg-[#0f172a] dark:border-white/10">'''

new = '''<header className="relative overflow-hidden px-6 md:px-10 py-6 border-b border-slate-200/70 bg-white/85 backdrop-blur-2xl shadow-[0_1px_0_rgba(226,232,240,0.75)] dark:border-white/10 dark:bg-[#07111f]/90 dark:shadow-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 opacity-80" />
      <div className="pointer-events-none absolute -top-28 right-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none absolute -bottom-32 left-32 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />'''

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
else:
    print("⚠️ Could not find the ProjectHeader shell class. Skipped header shell polish.")

# 3) Polish ViewNavigation shell.
old = '''        bg-white dark:bg-[#0f172a]
        sticky top-0 z-[100]
        transition-colors duration-300
        shadow-[0_1px_0_rgba(226,232,240,0.85)] dark:shadow-none'''

new = '''        bg-white/82 dark:bg-[#07111f]/88
        backdrop-blur-2xl
        sticky top-0 z-[100]
        transition-colors duration-300
        shadow-[0_1px_0_rgba(226,232,240,0.85),0_12px_30px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]'''

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
else:
    print("⚠️ Could not find ViewNavigation class block. Skipped nav polish.")

# 4) Upgrade OverviewView page wrapper only.
old = '''return (
    <div className="p-10 max-w-[1600px] mx-auto">'''

new = '''return (
    <div className="relative z-10 p-6 md:p-10 max-w-[1640px] mx-auto">'''

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
else:
    print("⚠️ Could not find OverviewView page wrapper. Skipped overview wrapper polish.")

# 5) Upgrade the root ProjectHome background.
old = '''return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-zinc-100">'''

new = '''return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.10),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-800 dark:bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:64px_64px] dark:opacity-30" />
      <div className="pointer-events-none fixed -top-32 right-12 z-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none fixed bottom-10 left-20 z-0 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />'''

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
else:
    print("⚠️ Could not find ProjectHome root wrapper. Skipped root background polish.")

# 6) Make main content explicitly sit above the new visual background.
old = '''<main key={pulseRefreshKey}>{renderViewContent()}</main>'''
new = '''<main key={pulseRefreshKey} className="relative z-10">{renderViewContent()}</main>'''

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
else:
    print("⚠️ Could not find main tag. It may already have a className.")

path.write_text(text)

print("")
print(f"✅ ProjectHome visual-only polish complete. Changes: {changed}")
print("✅ Ship Update is hidden for active projects, while Complete/Reopen actions remain.")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "Ship Update|isCompleted \\|\\| isReadyToClose|radial-gradient|backdrop-blur-2xl|<main key=\\{pulseRefreshKey\\}" src/pages/ProjectHome.jsx -C 5')
