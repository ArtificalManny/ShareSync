from pathlib import Path
import re

path = Path("src/pages/Home.jsx")
text = path.read_text()

backup = path.with_suffix(".jsx.bak-before-workload-intelligence")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

import_line = 'import { useWorkloadIntelligence } from "../hooks/useWorkloadIntelligence";'
import_anchor = 'import IntelligencePanel from "../components/home/IntelligencePanel";'

if import_line not in text:
    if import_anchor not in text:
        raise SystemExit("❌ Could not find IntelligencePanel import anchor. No changes written.")
    text = text.replace(import_anchor, import_anchor + "\n" + import_line, 1)
    print("✅ Added useWorkloadIntelligence import.")
else:
    print("✅ useWorkloadIntelligence import already exists.")

hook_line = "  const workloadIntel = useWorkloadIntelligence({ refreshMs: 30000 });"

if hook_line not in text:
    analytics_line = "  const { dashboardStats, loading: analyticsLoading } = useAnalytics() || {};"

    if analytics_line in text:
        text = text.replace(analytics_line, analytics_line + "\n" + hook_line, 1)
        print("✅ Inserted workloadIntel hook after useAnalytics().")
    else:
        # Fallback: insert after the first useDocumentTitle(...) call.
        pattern = re.compile(r"(\s+useDocumentTitle\([^)]*\);\n)")
        match = pattern.search(text)
        if not match:
            raise SystemExit("❌ Could not find a safe place to insert workloadIntel hook. No changes written.")

        text = text[:match.end()] + hook_line + "\n" + text[match.end():]
        print("✅ Inserted workloadIntel hook after useDocumentTitle().")
else:
    print("✅ workloadIntel hook already exists.")

# Replace the IntelligencePanel block.
start = text.find("              <IntelligencePanel")
if start == -1:
    raise SystemExit("❌ Could not find <IntelligencePanel block. No changes written.")

end = text.find("              />", start)
if end == -1:
    raise SystemExit("❌ Could not find end of <IntelligencePanel /> block. No changes written.")

end += len("              />")
old_block = text[start:end]

if 'onBalanceClick={() => handleOpenPanel("balance")}' not in old_block:
    raise SystemExit("❌ Found IntelligencePanel, but not the Home workload card block. No changes written.")

new_block = """              <IntelligencePanel
                workload={workloadIntel.data}
                workloadLoading={workloadIntel.loading}
                workloadError={workloadIntel.error}
                isBalanced={workloadIntel.data?.isBalanced ?? false}
                onBalanceClick={() => handleOpenPanel("balance")}
                peakWindowStart={intelligence.peakWindowStart}
                peakWindowEnd={intelligence.peakWindowEnd}
                productivity={intelligence.productivity}
                coWorkingMultiplier={intelligence.coWorkingMultiplier}
                isCoWorking={intelligence.isCoWorking}
              />"""

text = text[:start] + new_block + text[end:]
print("✅ Wired IntelligencePanel to workloadIntel data.")

team_pattern = re.compile(
    r"<TeamBalancePanel\s+onBalanceComplete=\{\(\)\s*=>\s*setIsBalanced\(true\)\}\s*/>",
    re.MULTILINE,
)

team_replacement = """<TeamBalancePanel
            workload={workloadIntel.data}
            loading={workloadIntel.loading}
            error={workloadIntel.error}
            onRefresh={workloadIntel.refresh}
          />"""

text, count = team_pattern.subn(team_replacement, text, count=1)

if count == 1:
    print("✅ Wired TeamBalancePanel to workloadIntel data.")
else:
    print("⚠️ Could not auto-replace TeamBalancePanel one-liner. Manual change may be needed.")

path.write_text(text)

print("")
print("Inspect:")
print('rg -n "useWorkloadIntelligence|workloadIntel|<IntelligencePanel|<TeamBalancePanel" src/pages/Home.jsx -C 6')
