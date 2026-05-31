from pathlib import Path
from datetime import datetime

path = Path("src/api/projects.js")

if not path.exists():
    raise SystemExit("❌ src/api/projects.js not found.")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-overview-first-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

start_marker = "export const getProjectClosureReadiness = async (projectId) => {"
end_marker = "\nexport const completeProject = async"

start = text.find(start_marker)
end = text.find(end_marker, start)

if start == -1:
    raise SystemExit("❌ Could not find getProjectClosureReadiness export. No changes written.")

if end == -1:
    raise SystemExit("❌ Could not find completeProject export after getProjectClosureReadiness. No changes written.")

replacement = '''export const getProjectClosureReadiness = async (projectId) => {
  const id = String(projectId || "").trim();

  if (!id) {
    const err = new Error("projectId is required");
    err.normalizedMessage = "projectId is required";
    throw err;
  }

  const pickReadiness = (payload) => {
    const data =
      payload?.data ||
      payload?.overview ||
      payload?.result ||
      payload;

    return (
      data?.finishLine ||
      data?.closureReadiness ||
      data?.readiness ||
      data?.project?.finishLine ||
      data?.project?.closureReadiness ||
      payload?.finishLine ||
      payload?.closureReadiness ||
      payload?.readiness ||
      null
    );
  };

  // IMPORTANT:
  // ProjectHome's Finish Line already uses the project overview contract.
  // Home missions should use that same source first so the mini progress bar
  // matches the Finish Line readiness score.
  try {
    const overviewResponse = await api.get(`/projects/${id}/overview`);
    const overviewData = unwrap(overviewResponse);
    const readiness = pickReadiness(overviewData);

    if (readiness && typeof readiness === "object") {
      return normalizeClosureReadiness(readiness);
    }
  } catch (overviewErr) {
    console.warn(
      "[projects.js] Project overview readiness failed; falling back to closure-readiness endpoint:",
      overviewErr?.normalizedMessage || overviewErr?.message || overviewErr
    );
  }

  // Fallback for older backend contracts.
  try {
    const response = await api.get(`/projects/${id}/closure-readiness`);
    const data = unwrap(response);
    return normalizeClosureReadiness(data);
  } catch (err) {
    throw normalizeError(err, "Failed to evaluate project closure readiness");
  }
};

'''

text = text[:start] + replacement + text[end + 1:]

path.write_text(text)

print("✅ getProjectClosureReadiness() now uses /projects/:id/overview first.")
print("✅ Home mission bars should now match ProjectHome Finish Line readiness.")
print("✅ /closure-readiness remains as a fallback only.")
print("")
print("Inspect with:")
print('rg -n "getProjectClosureReadiness|/overview|/closure-readiness|Project overview readiness failed" src/api/projects.js -C 8')
