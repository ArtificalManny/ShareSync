from pathlib import Path
from datetime import datetime
import re

path = Path("src/api/home.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-home-ship-update-endpoint-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

pattern = re.compile(
    r"export\s+async\s+function\s+tryShipProject\s*\(\s*projectId\s*\)\s*\{.*?\n\}",
    re.DOTALL,
)

replacement = """export async function tryShipProject(projectId) {
  if (!projectId) {
    throw new Error("tryShipProject requires a projectId");
  }

  try {
    const payload = {
      title: "Home mission shipped",
      description: "Shipped from Suggested Projects & Missions on Home.",
      category: "home_mission",
      source: "home_suggested_missions",
    };

    const response = await api.post(`/projects/${projectId}/ships`, payload);
    return response?.data?.data || response?.data?.project || response?.data || null;
  } catch (error) {
    console.error("[Home] Project ship failed:", {
      projectId,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    throw error;
  }
}"""

if not pattern.search(text):
    raise SystemExit("❌ Could not find export async function tryShipProject(projectId). No changes written.")

text = pattern.sub(replacement, text, count=1)

if "`/projects/${projectId}/complete`" in text:
    print("⚠️ Found /complete elsewhere in home.js. Inspect manually after this patch.")

if "`/projects/${projectId}/ships`" not in text:
    raise SystemExit("❌ Safety check failed: /ships endpoint missing after patch.")

path.write_text(text)

print("✅ Home Ship now calls POST /projects/:id/ships.")
print("✅ This should log a ship/update instead of trying to close the whole project.")
print("✅ 403 from closeout permissions should stop if /ships allows normal project members.")
print("")
print("Inspect with:")
print("rg -n \"tryShipProject|/ships|/complete|Project ship failed\" src/api/home.js -C 10")
