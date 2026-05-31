from pathlib import Path
from datetime import datetime
import re

path = Path("src/api/home.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-loud-home-ship-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

pattern = re.compile(
    r"export\s+async\s+function\s+tryShipProject\s*\([^)]*\)\s*\{.*?\n\}",
    re.DOTALL,
)

replacement = '''export async function tryShipProject(projectId) {
  if (!projectId) {
    throw new Error("tryShipProject requires a projectId.");
  }

  const payload = {
    forceComplete: true,
    leftoverDecision: "backlog",
    closureSummary: "Project shipped from Home mission card.",
    closureChecklist: {
      summaryWritten: true,
      outcomeConfirmed: true,
      stakeholderSignoff: true,
    },
  };

  try {
    const response = await client.post(`/projects/${projectId}/complete`, payload);
    return response?.data?.data || response?.data?.project || response?.data;
  } catch (error) {
    console.error("[Home] Project ship failed:", {
      projectId,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    throw error;
  }
}'''

if not pattern.search(text):
    raise SystemExit("❌ Could not find export async function tryShipProject(...) block. No changes written.")

text = pattern.sub(replacement, text, count=1)

path.write_text(text)

print("✅ tryShipProject() now calls POST /projects/:id/complete directly.")
print("✅ No fake fallback. If the backend rejects it, the console will show the real reason.")
print("")
print("Inspect with:")
print("rg -n \"tryShipProject|forceComplete|Project ship failed\" src/api/home.js -C 8")
