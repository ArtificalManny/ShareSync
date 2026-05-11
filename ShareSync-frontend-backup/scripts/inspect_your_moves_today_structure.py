from pathlib import Path
import re

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/YourMovesToday.jsx")

text = path.read_text()
lines = text.splitlines()

print("\n✅ Inspecting src/components/focus/YourMovesToday.jsx")
print("Total lines:", len(lines))

patterns = [
    "displayMoves",
    "dailyFocus",
    "selectedMoves",
    "suggestions",
    "activeMoves",
    "planStatus",
    "focusStatus",
    "todayPlan",
    "today's plan",
    "TODAY",
    "addDailyFocusMove",
    "acceptTodayDailyFocus",
    "completeDailyFocusMove",
    "function EmptyState",
    "export function YourMovesWidget",
    "export function FocusBanner",
]

print("\n========== SYMBOL MATCHES ==========")
for pattern in patterns:
    matches = []
    for i, line in enumerate(lines, start=1):
        if pattern in line:
            matches.append((i, line.strip()))

    if matches:
        print(f"\n--- {pattern} ---")
        for line_no, line_text in matches[:20]:
            print(f"{line_no:04d}: {line_text}")

print("\n========== IMPORTS ==========")
for i, line in enumerate(lines[:40], start=1):
    print(f"{i:04d}: {line}")

print("\n========== MAIN COMPONENT START ==========")
for i, line in enumerate(lines, start=1):
    if "export default function YourMovesToday" in line:
        start = max(1, i - 5)
        end = min(len(lines), i + 90)
        for j in range(start, end + 1):
            print(f"{j:04d}: {lines[j-1]}")
        break

print("\n========== CONTENT / RENDER REGION ==========")
render_keywords = [
    "Today's Plan Locked",
    "TODAY'S PLAN LOCKED",
    "Recommended from your active projects",
    "RECOMMENDED FROM YOUR ACTIVE PROJECTS",
    "Complete all",
    "COMPLETE ALL",
]

found_render = False
for keyword in render_keywords:
    for i, line in enumerate(lines, start=1):
        if keyword in line:
            found_render = True
            start = max(1, i - 35)
            end = min(len(lines), i + 90)
            print(f"\n--- Around `{keyword}` at line {i} ---")
            for j in range(start, end + 1):
                print(f"{j:04d}: {lines[j-1]}")
            break

if not found_render:
    print("⚠️ Could not find obvious render keywords.")

print("\n========== EMPTY STATE / EXPORT TAIL ==========")
for i, line in enumerate(lines, start=1):
    if "function EmptyState" in line:
        start = max(1, i - 10)
        end = min(len(lines), i + 90)
        for j in range(start, end + 1):
            print(f"{j:04d}: {lines[j-1]}")
        break

print("\n✅ Inspection complete. No files were changed.")
