from pathlib import Path
import re
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_name(
    f"ProjectHome.jsx.bak-before-pulse-blocked-override-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

changed = 0

# 1) Stop passing criticalMoves as blockers into Pulse.
old = "              blockers={criticalMoves}"
new = "              blockers={overview?.blockers || overview?.blockingReasons || overview?.finishLine?.blockers || []}"

if old in text:
    text = text.replace(old, new, 1)
    changed += 1
    print("✅ Replaced blockers={criticalMoves} with real blocker sources.")
else:
    print("ℹ️ blockers={criticalMoves} not found. Skipping that replacement.")

# 2) Replace the Pulse merge so stale server/summary blocked counts cannot override live derived task counts.
pattern = re.compile(
    r"""  const pulse = useMemo\(\(\) => \{\n.*?  \}, \[serverPulse, derivedPulse, summary\?\.blockedCount\]\);\n""",
    re.DOTALL,
)

replacement = """  const pulse = useMemo(() => {
    const finishLineBlocked = readNumber(
      overview?.finishLine?.blockerCount ??
        overview?.finishLine?.blockersCount ??
        overview?.finishLine?.unresolvedBlockers ??
        overview?.finishLine?.unresolvedBlockerCount ??
        (Array.isArray(overview?.finishLine?.blockers)
          ? overview.finishLine.blockers.length
          : 0),
      0
    );

    const today = readNumber(derivedPulse?.today, 0);
    const inMotion = readNumber(derivedPulse?.inMotion, 0);
    const blocked = Math.max(readNumber(derivedPulse?.blocked, 0), finishLineBlocked);
    const ready = readNumber(derivedPulse?.ready, 0);

    return {
      todayCompleted: today,
      today,
      completedToday: today,
      shipsToday: today,
      inMotion,
      blocked,
      ready,
    };
  }, [derivedPulse, overview?.finishLine]);\n"""

text, count = pattern.subn(replacement, text, count=1)

if count:
    changed += 1
    print("✅ Replaced Pulse merge so backend stale blockedCount cannot force 42.")
else:
    print("❌ Could not find the Pulse merge block.")
    print("Run:")
    print('rg -n "const pulse = useMemo|serverPulse|summary\\.blockedCount|derivedPulse|blocked:" src/pages/ProjectHome.jsx -C 12')
    raise SystemExit(1)

path.write_text(text)

print("")
print(f"✅ ProjectHome Pulse blocked override fix complete. Changes applied: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "const pulse = useMemo|finishLineBlocked|blocked =|blockers=\\{|OverviewPulseCard pulse" src/pages/ProjectHome.jsx -C 10')
