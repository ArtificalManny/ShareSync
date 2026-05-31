from pathlib import Path
from datetime import datetime
import re

path = Path("src/api/home.js")
text = path.read_text()

backup = path.with_suffix(path.suffix + f".bak-before-harden-try-ship-project-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

pattern = r"""export async function tryShipProject\(projectId\) \{[\s\S]*?\n\}"""

replacement = """export async function tryShipProject(projectId, payload = {}) {
  if (!projectId) {
    throw new Error("tryShipProject requires a projectId.");
  }

  const body = {
    forceComplete: true,
    leftoverDecision: "backlog",
    closureSummary:
      payload.closureSummary ||
      payload.description ||
      "Project shipped from Suggested Projects & Missions.",
    closureChecklist: {
      summaryWritten: true,
      ...(payload.closureChecklist || {}),
    },
    ...payload,
  };

  // Durable backend path: writes status='completed' and completedAt.
  const data = await safePost(`/projects/${projectId}/complete`, body);

  return data || null;
}"""

text, count = re.subn(pattern, replacement, text, count=1)

if count != 1:
    raise SystemExit("❌ Could not replace tryShipProject() in src/api/home.js. No changes written.")

path.write_text(text)

print("✅ tryShipProject() now calls POST /projects/:id/complete with forceComplete payload.")
print("✅ This should persist status/completedAt instead of only animating locally.")
print("")
print("Inspect with:")
print("rg -n \"tryShipProject|forceComplete|leftoverDecision|Project shipped\" src/api/home.js -C 8")
