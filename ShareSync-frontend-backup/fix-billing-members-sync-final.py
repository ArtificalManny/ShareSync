from pathlib import Path
import shutil
import datetime

path = Path("src/components/settings/BillingSettings.jsx")
backup = path.with_suffix(path.suffix + f".backup-before-members-sync-final-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}")

if not path.exists():
    raise RuntimeError("Could not find src/components/settings/BillingSettings.jsx")

text = path.read_text()
shutil.copy2(path, backup)

# 1) Add helper function after toNumber()
needle = """function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
"""

replacement = """function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}
"""

if needle not in text:
    raise RuntimeError("Could not find toNumber helper block.")

text = text.replace(needle, replacement, 1)

# 2) Replace membersUsed resolver
old = """  const membersUsed = toNumber(
    usage.membersPerProject ?? usage.maxMembersInProject ?? subscription?.activeMembers,
    0
  );
"""

new = """  const membersUsed = firstPositiveNumber(
    usage.membersPerProject,
    usage.maxMembersInProject,
    usage.activeMembers,
    subscription?.activeMembers,
    subscription?.membersPerProject,
    subscription?.memberCount
  );
"""

if old not in text:
    raise RuntimeError("Could not find membersUsed block.")

text = text.replace(old, new, 1)

path.write_text(text)

print("✅ Billing members/project sync fixed.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Settings Billing now uses the first real positive member count")
print("- This prevents fallback 0 from overriding activeMembers")
print("- Members/Project should now match the navbar dropdown")
print("")
print("Next:")
print("1. Stop Vite with Control+C")
print("2. Restart: npm run dev")
print("3. Hard refresh Chrome: Cmd+Shift+R")
