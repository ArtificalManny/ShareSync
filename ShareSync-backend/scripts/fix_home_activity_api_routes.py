from pathlib import Path
import re

path = Path("src/api/home.js")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

pattern = re.compile(
    r"export\s+async\s+function\s+fetchActivities\s*\([^)]*\)\s*\{.*?\n\}",
    re.DOTALL,
)

replacement = """export async function fetchActivities(options = {}) {
  const limit = options?.limit || 80;

  const attempts = [
    () => client.get("/activities/feed", { params: { limit } }),
    () => client.get("/activity", { params: { scope: "user", limit } }),
  ];

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const data = response.data;

      const items =
        data?.items ||
        data?.data?.items ||
        data?.data ||
        data?.activities ||
        data;

      return Array.isArray(items) ? items : [];
    } catch (err) {
      const status = err?.response?.status;

      if (status && status !== 404) {
        console.warn("[home.api] fetchActivities failed:", status, err?.message);
      }
    }
  }

  return [];
}"""

if "export async function fetchActivities" not in text:
    raise SystemExit("Could not find fetchActivities export in src/api/home.js.")

text = pattern.sub(replacement, text, count=1)

path.write_text(text)
print("Patched fetchActivities route order in src/api/home.js")
