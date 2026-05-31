from pathlib import Path
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

changed = 0

# 1) Import buildProjectPulse
import_line = 'import { getStatusColor } from "../utils/statusColor";'
new_import_block = '''import { getStatusColor } from "../utils/statusColor";
import { buildProjectPulse } from "../utils/projectPulse";'''

if 'from "../utils/projectPulse"' not in text:
    if import_line not in text:
        raise SystemExit("❌ Could not find statusColor import.")
    text = text.replace(import_line, new_import_block, 1)
    changed += 1
    print("✅ Added buildProjectPulse import.")
else:
    print("ℹ️ buildProjectPulse import already exists.")

# 2) Replace OverviewPulseCard with safer version that accepts today OR todayCompleted
start = text.find("function OverviewPulseCard({ pulse }) {")
if start == -1:
    raise SystemExit("❌ Could not find OverviewPulseCard.")

marker = "// ═══════════════════════════════════════════════════════════════════════════════\n// OVERVIEW HELPERS"
end = text.find(marker, start)
if end == -1:
    raise SystemExit("❌ Could not find OVERVIEW HELPERS marker after OverviewPulseCard.")

new_pulse_card = '''function OverviewPulseCard({ pulse }) {
  const today = readNumber(
    pulse?.todayCompleted ??
      pulse?.today ??
      pulse?.completedToday ??
      pulse?.shipsToday,
    0
  );

  const inMotion = readNumber(
    pulse?.inMotion ??
      pulse?.active ??
      pulse?.inProgress,
    0
  );

  const blocked = readNumber(
    pulse?.blocked ??
      pulse?.blockedCount ??
      pulse?.blockers,
    0
  );

  const ready = readNumber(
    pulse?.ready ??
      pulse?.readyCount ??
      pulse?.open,
    0
  );

  const items = [
    {
      label: "Today",
      value: today,
      icon: Flame,
      tone: "text-amber-500",
    },
    {
      label: "In motion",
      value: inMotion,
      icon: Zap,
      tone: "text-violet-500",
    },
    {
      label: "Blocked",
      value: blocked,
      icon: AlertTriangle,
      tone: blocked > 0 ? "text-amber-500" : "text-slate-400",
    },
    {
      label: "Ready",
      value: ready,
      icon: Play,
      tone: "text-emerald-500",
    },
  ];

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Pulse</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Unified snapshot of execution signals
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Live</span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${item.tone}`} />
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {item.label}
                </span>
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

'''

text = text[:start] + new_pulse_card + text[end:]
changed += 1
print("✅ Replaced OverviewPulseCard with normalized Pulse reader.")

# 3) Add tasks/blockers props to OverviewView signature
old_sig = '''  isStartingSprint = false,
  projectOnlineCount = 0,
}) {'''
new_sig = '''  isStartingSprint = false,
  projectOnlineCount = 0,
  tasks = [],
  blockers = [],
}) {'''

if old_sig in text:
    text = text.replace(old_sig, new_sig, 1)
    changed += 1
    print("✅ Added tasks/blockers props to OverviewView.")
elif "tasks = []" in text and "blockers = []" in text:
    print("ℹ️ OverviewView already has tasks/blockers props.")
else:
    raise SystemExit("❌ Could not patch OverviewView signature.")

# 4) Replace raw overview pulse with merged backend + derived pulse
old_pulse_block = '''  const summary = overview?.summary || {};
  const pulse = overview?.pulse || {};
  const momentum = overview?.momentum || {};'''

new_pulse_block = '''  const summary = overview?.summary || {};
  const serverPulse = overview?.pulse || {};

  const derivedPulse = useMemo(() => {
    return buildProjectPulse(project || overview?.project || {}, {
      tasks,
      blockers,
    });
  }, [project, overview?.project, tasks, blockers]);

  const pulse = useMemo(() => {
    return {
      todayCompleted: Math.max(
        readNumber(serverPulse?.todayCompleted ?? serverPulse?.today ?? serverPulse?.completedToday, 0),
        readNumber(derivedPulse?.today, 0)
      ),
      inMotion: Math.max(
        readNumber(serverPulse?.inMotion ?? serverPulse?.active ?? serverPulse?.inProgress, 0),
        readNumber(derivedPulse?.inMotion, 0)
      ),
      blocked: Math.max(
        readNumber(serverPulse?.blocked ?? serverPulse?.blockedCount ?? serverPulse?.blockers, 0),
        readNumber(summary?.blockedCount, 0),
        readNumber(derivedPulse?.blocked, 0)
      ),
      ready: Math.max(
        readNumber(serverPulse?.ready ?? serverPulse?.readyCount ?? serverPulse?.open, 0),
        readNumber(derivedPulse?.ready, 0)
      ),
    };
  }, [serverPulse, derivedPulse, summary?.blockedCount]);

  const momentum = overview?.momentum || {};'''

if old_pulse_block in text:
    text = text.replace(old_pulse_block, new_pulse_block, 1)
    changed += 1
    print("✅ OverviewView now merges backend pulse + derived live pulse.")
else:
    print("ℹ️ Pulse block not found exactly; checking if already patched.")
    if "const derivedPulse = useMemo" not in text:
        raise SystemExit("❌ Could not find pulse block to replace.")

# 5) Pass liveTasks into OverviewView
old_call = '''              projectOnlineCount={projectOnlineCount}
            />'''
new_call = '''              projectOnlineCount={projectOnlineCount}
              tasks={liveTasks}
              blockers={criticalMoves}
            />'''

if old_call in text:
    text = text.replace(old_call, new_call, 1)
    changed += 1
    print("✅ Passed liveTasks/criticalMoves into OverviewView.")
elif "tasks={liveTasks}" in text:
    print("ℹ️ OverviewView already receives liveTasks.")
else:
    raise SystemExit("❌ Could not find OverviewView call to patch.")

# 6) Make overview refresh signal bump Pulse key too
old_refresh_signal = '''    const handleOverviewRefreshSignal = (payload) => {
      if (!matchesProject(payload)) return;
      scheduleOverviewRefresh();
    };'''

new_refresh_signal = '''    const handleOverviewRefreshSignal = (payload) => {
      if (!matchesProject(payload)) return;
      setPulseRefreshKey((k) => k + 1);
      scheduleOverviewRefresh();
    };'''

if old_refresh_signal in text:
    text = text.replace(old_refresh_signal, new_refresh_signal, 1)
    changed += 1
    print("✅ Overview refresh signals now force Pulse re-render.")
elif "const handleOverviewRefreshSignal = (payload) =>" in text and "setPulseRefreshKey((k) => k + 1);" in text:
    print("ℹ️ Overview refresh signal already bumps Pulse key.")
else:
    raise SystemExit("❌ Could not patch handleOverviewRefreshSignal.")

# 7) Expand event map for completion/status/blocker events
event_anchor = '''      ["taskUpdated", handleTaskPatch],
      ["task:update", handleTaskPatch],'''

event_expansion = '''      ["taskUpdated", handleTaskPatch],
      ["task:update", handleTaskPatch],
      ["taskStatusChanged", handleTaskPatch],
      ["task:statusChanged", handleTaskPatch],
      ["taskMoved", handleTaskPatch],
      ["task:moved", handleTaskPatch],
      ["taskCompleted", handleOverviewRefreshSignal],
      ["task:completed", handleOverviewRefreshSignal],'''

if event_anchor in text and "task:completed" not in text:
    text = text.replace(event_anchor, event_expansion, 1)
    changed += 1
    print("✅ Added task status/completion socket events.")
else:
    print("ℹ️ Task status/completion events already present or anchor not needed.")

activity_anchor = '''      ["activityCreated", handleOverviewRefreshSignal],
      ["activity:created", handleOverviewRefreshSignal],'''

activity_expansion = '''      ["activityCreated", handleOverviewRefreshSignal],
      ["activity:created", handleOverviewRefreshSignal],
      ["blockerCreated", handleOverviewRefreshSignal],
      ["blocker:created", handleOverviewRefreshSignal],
      ["blockerUpdated", handleOverviewRefreshSignal],
      ["blocker:updated", handleOverviewRefreshSignal],
      ["blockerResolved", handleOverviewRefreshSignal],
      ["blocker:resolved", handleOverviewRefreshSignal],'''

if activity_anchor in text and "blocker:resolved" not in text:
    text = text.replace(activity_anchor, activity_expansion, 1)
    changed += 1
    print("✅ Added blocker socket events.")
else:
    print("ℹ️ Blocker events already present or anchor not needed.")

path.write_text(text)

print("")
print(f"✅ Project Pulse wiring complete. Changes applied: {changed}")
print("")
print("Inspect:")
print('rg -n "buildProjectPulse|derivedPulse|serverPulse|OverviewPulseCard|tasks=\\{liveTasks\\}|task:completed|blocker:resolved|handleOverviewRefreshSignal" src/pages/ProjectHome.jsx -C 8')
