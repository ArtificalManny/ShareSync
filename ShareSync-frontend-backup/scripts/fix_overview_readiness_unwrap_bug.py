from pathlib import Path
from datetime import datetime

path = Path("src/api/projects.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-overview-readiness-unwrap-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = """    const overviewResponse = await api.get(`/projects/${id}/overview`);
    const overviewData = unwrap(overviewResponse);
    const readiness = pickReadiness(overviewData);"""

new = """    const overviewResponse = await api.get(`/projects/${id}/overview`);

    // IMPORTANT:
    // Do NOT use unwrap() here.
    // unwrap() returns data.project when it sees a `project` key, which discards
    // overview-level fields like `closureReadiness`.
    const overviewPayload = overviewResponse?.data;
    const overviewData =
      overviewPayload?.data ||
      overviewPayload?.overview ||
      overviewPayload?.result ||
      overviewPayload;

    const readiness = pickReadiness(overviewData);"""

if old not in text:
    raise SystemExit("❌ Could not find the old overview unwrap block. No changes written.")

text = text.replace(old, new, 1)

path.write_text(text)

print("✅ Fixed getProjectClosureReadiness() overview parsing.")
print("✅ It now preserves overview.closureReadiness instead of accidentally returning overview.project.")
print("")
print("Inspect with:")
print('rg -n "Do NOT use unwrap|getProjectClosureReadiness|overviewPayload|overviewData|pickReadiness" src/api/projects.js -C 8')
