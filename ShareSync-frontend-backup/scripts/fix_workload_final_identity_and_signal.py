from pathlib import Path
import re

path = Path("src/api/workloadIntelligence.js")

if not path.exists():
    raise SystemExit("❌ src/api/workloadIntelligence.js not found.")

text = path.read_text()

backup = path.with_suffix(".js.bak-before-final-workload-identity-signal")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1. Replace dedupeWorkloadPersonnel with a stronger two-pass version.
pattern = re.compile(
    r"function dedupeWorkloadPersonnel\(personnel = \[\]\) \{[\s\S]*?\n\}",
    re.MULTILINE,
)

replacement = r'''function dedupeWorkloadPersonnel(personnel = []) {
  const safePeople = Array.isArray(personnel) ? personnel : [];

  // Pass 1: merge obvious same IDs/emails.
  const byStrongKey = new Map();

  for (const person of safePeople) {
    const key = getWorkloadPersonDedupeKey(person);
    if (!key) continue;

    const existing = byStrongKey.get(key);
    byStrongKey.set(key, existing ? mergeWorkloadPeople(existing, person) : person);
  }

  // Pass 2: merge duplicate display-name rows that survived because one row
  // had an ID and the other row only had a name fallback.
  const byName = new Map();

  for (const person of Array.from(byStrongKey.values())) {
    const nameKey = normalizeWorkloadPersonNameKey(person.name);
    const emailKey = normalizeWorkloadPersonNameKey(person.email);

    const weakKey = emailKey ? `email:${emailKey}` : nameKey ? `name:${nameKey}` : "";

    if (!weakKey) continue;

    const existing = byName.get(weakKey);
    byName.set(weakKey, existing ? mergeWorkloadPeople(existing, person) : person);
  }

  return Array.from(byName.values());
}'''

matches = list(pattern.finditer(text))
if not matches:
    raise SystemExit("❌ Could not find dedupeWorkloadPersonnel(). No changes written.")

text = text[:matches[-1].start()] + replacement + text[matches[-1].end():]
print("✅ Replaced dedupeWorkloadPersonnel() with two-pass dedupe.")

# 2. Add final workload signal normalizer if missing.
helper = r'''
function finalizeWorkloadSignal(payload = {}) {
  const personnel = Array.isArray(payload.personnel) ? payload.personnel : [];
  const totalShips = Number(payload.totalShips || 0);
  const activeContributors = personnel.filter((p) => Number(p.shipsCompleted || 0) > 0);
  const teamSize = personnel.length;

  if (totalShips <= 0) {
    return {
      ...payload,
      title: "No Workload Signal Yet",
      diagnosticTitle: "No Workload Signal Yet",
      description: "No shipped work is attributed in this scope yet.",
      diagnosticDescription: "Once people start shipping work, OpenShare can detect load imbalance.",
      currentUserLoadPercent: 0,
      currentUserShipCount: 0,
      teamAverageShips: 0,
      imbalanceRatio: 0,
      isBalanced: true,
      isHighWorkload: false,
      hasTeam: teamSize > 1,
      personnel: personnel.map((person) => ({
        ...person,
        loadPercent: 0,
      })),
    };
  }

  const normalizedPersonnel = personnel.map((person) => ({
    ...person,
    loadPercent: Math.round(
      (Number(person.shipsCompleted || 0) / Math.max(totalShips, 1)) * 100
    ),
  }));

  const currentUser = normalizedPersonnel.find((person) => person.isCurrentUser);
  const currentUserLoadPercent = Number(currentUser?.loadPercent || 0);
  const currentUserShipCount = Number(currentUser?.shipsCompleted || 0);
  const teamAverageShips = teamSize > 0 ? totalShips / teamSize : totalShips;
  const maxShips = Math.max(...normalizedPersonnel.map((p) => Number(p.shipsCompleted || 0)), 0);
  const imbalanceRatio = teamAverageShips > 0 ? Number((maxShips / teamAverageShips).toFixed(1)) : 0;

  const singlePersonCarrying =
    teamSize > 1 &&
    activeContributors.length === 1 &&
    totalShips > 0;

  const isHighWorkload =
    singlePersonCarrying ||
    currentUserLoadPercent >= 70 ||
    imbalanceRatio >= 2.5;

  return {
    ...payload,
    personnel: normalizedPersonnel,
    currentUserLoadPercent,
    currentUserShipCount,
    teamAverageShips,
    imbalanceRatio,
    isBalanced: !isHighWorkload,
    isHighWorkload,
    title: isHighWorkload ? "High Workload" : "Load Balanced",
    diagnosticTitle: isHighWorkload ? "Workload Imbalance" : "Load Balanced",
    description: isHighWorkload
      ? `You're doing ${currentUserLoadPercent}% of ships. Rebalance suggested.`
      : "Current output is distributed across active personnel.",
    diagnosticDescription: singlePersonCarrying
      ? "One person is carrying all attributed shipped work in this scope."
      : isHighWorkload
        ? `Your current output is ${imbalanceRatio}× the team average. This pace may be unsustainable.`
        : "Current output is distributed across active personnel.",
  };
}
'''

if "function finalizeWorkloadSignal(" not in text:
    marker = "export async function"
    idx = text.find(marker)
    if idx == -1:
        marker = "export default"
        idx = text.find(marker)

    if idx == -1:
        text += "\n" + helper + "\n"
    else:
        text = text[:idx] + helper + "\n" + text[idx:]

    print("✅ Added finalizeWorkloadSignal().")
else:
    print("✅ finalizeWorkloadSignal() already exists.")

# 3. Wrap buildWorkloadFromProjects return object if possible.
# Find the final return object in buildWorkloadFromProjects by replacing common direct returns.
direct_patterns = [
    "return {\n    title:",
    "return {\n    diagnosticTitle:",
]

wrapped = False
for old in direct_patterns:
    if old in text and "return finalizeWorkloadSignal({" not in text:
        text = text.replace(old, old.replace("return {", "return finalizeWorkloadSignal({"), 1)

        # Close the first matching return object before function end.
        # Safer targeted replacement around known final fields.
        text = text.replace("\n  };\n}\n\nexport", "\n  });\n}\n\nexport", 1)
        wrapped = True
        print("✅ Wrapped buildWorkloadFromProjects result with finalizeWorkloadSignal().")
        break

if not wrapped:
    print("⚠️ Could not auto-wrap buildWorkloadFromProjects return.")
    print("Manual check needed: make sure buildWorkloadFromProjects returns finalizeWorkloadSignal({...}).")

path.write_text(text)

print("")
print("✅ Workload final identity/signal patch complete.")
print("")
print("Inspect:")
print('rg -n "dedupeWorkloadPersonnel|finalizeWorkloadSignal|return finalizeWorkloadSignal|currentUserLoadPercent|No Workload Signal" src/api/workloadIntelligence.js -C 8')
