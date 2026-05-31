from pathlib import Path
from datetime import datetime

path = Path("src/api/home.js")
text = path.read_text()
backup = path.with_suffix(path.suffix + f".bak-before-home-ship-complete-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = """export async function shipMission(projectId) {
  return (
    (await safePost(`/projects/${projectId}/ship`, {})) ||
    (await safePost(`/projects/${projectId}/complete`, {})) ||
    { success: true }
  );
}
"""

new = """export async function shipMission(projectId, payload = {}) {
  if (!projectId) {
    throw new Error("shipMission requires a projectId.");
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

  // Durable path: this is the real backend route that writes status/completedAt.
  return await safePost(`/projects/${projectId}/complete`, body);
}
"""

if old not in text:
    raise SystemExit("❌ Could not find the old shipMission block in src/api/home.js. No changes written.")

text = text.replace(old, new)

path.write_text(text)

print("✅ api/home.js shipMission now uses POST /projects/:id/complete.")
print("✅ It sends forceComplete + closeout payload so completedAt/status persist.")
print("✅ Old /projects/:id/ship fallback removed for this Home mission flow.")
print("")
print("Inspect with:")
print("rg -n \"shipMission|forceComplete|leftoverDecision|Project shipped\" src/api/home.js -C 8")
