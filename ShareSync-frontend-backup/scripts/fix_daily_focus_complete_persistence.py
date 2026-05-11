from pathlib import Path
from datetime import datetime

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/YourMovesToday.jsx. No changes made.")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"src/components/focus/YourMovesToday.jsx.bak-before-complete-persistence-{stamp}")
backup.write_text(original)

print(f"✅ Backup created: {backup}")

helper_marker = "\nexport default function YourMovesToday({"

helper_block = """
function markDailyFocusMoveDoneInPlan(plan, moveId) {
  if (!plan || !moveId) return plan;

  const now = new Date().toISOString();

  const markList = (items) => {
    if (!Array.isArray(items)) return items;

    return items.map((item) => {
      if (getMoveIdentity(item) !== moveId) return item;

      return {
        ...item,
        status: 'done',
        completedAt: item.completedAt || now,
        updatedAt: now,
      };
    });
  };

  const selectedMoves = markList(plan.selectedMoves);
  const suggestions = markList(plan.suggestions);

  const activeMoves = (
    Array.isArray(selectedMoves) && selectedMoves.length > 0
      ? selectedMoves
      : Array.isArray(suggestions)
        ? suggestions
        : []
  ).filter((item) => String(item?.status || '').toLowerCase() !== 'dismissed');

  const nextStatus =
    Array.isArray(selectedMoves) && selectedMoves.length > 0
      ? activeMoves.length > 0 && activeMoves.every(isMoveDone)
        ? 'completed'
        : 'accepted'
      : plan.status;

  return {
    ...plan,
    status: nextStatus,
    selectedMoves,
    suggestions,
  };
}

"""

if "function markDailyFocusMoveDoneInPlan" not in text:
    if helper_marker not in text:
        raise SystemExit("❌ Could not find YourMovesToday export marker. No changes written.")

    text = text.replace(helper_marker, "\n" + helper_block + helper_marker, 1)

old_handle_complete = """  const handleComplete = useCallback(async (moveOrId) => {
    const moveId = getMoveIdentity(moveOrId);

    if (!moveId) return;

    if (dailyFocusMoveIds.has(moveId)) {
      const updatedPlan = await completeDailyFocusMove(moveId);
      setDailyFocusPlan(updatedPlan);
      return;
    }

    if (completeMove) await completeMove(moveId);
  }, [completeMove, dailyFocusMoveIds]);"""

new_handle_complete = """  const handleComplete = useCallback(async (moveOrId) => {
    const moveId = getMoveIdentity(moveOrId);

    if (!moveId) return;

    if (dailyFocusMoveIds.has(moveId)) {
      setIsPlanningAction(true);

      try {
        let planForCompletion = dailyFocusPlan;

        // If the user completes a suggested move before explicitly accepting the plan,
        // first lock today's visible suggestions into selectedMoves so completion can persist.
        if (!hasAcceptedDailyPlan) {
          const moveIdsToAccept = dailyFocusMoves
            .slice(0, maxMoves)
            .map(getMoveIdentity)
            .filter(Boolean);

          if (!moveIdsToAccept.includes(moveId)) {
            moveIdsToAccept.unshift(moveId);
          }

          const acceptedPlan = await acceptTodayDailyFocus(
            moveIdsToAccept.slice(0, maxMoves),
          );

          planForCompletion = acceptedPlan;
          setDailyFocusPlan(acceptedPlan);
        }

        // Optimistic local update so the Completion stat changes immediately.
        setDailyFocusPlan((currentPlan) =>
          markDailyFocusMoveDoneInPlan(currentPlan || planForCompletion, moveId),
        );

        // Backend persistence.
        const updatedPlan = await completeDailyFocusMove(moveId);
        setDailyFocusPlan(updatedPlan);
      } finally {
        setIsPlanningAction(false);
      }

      return;
    }

    if (completeMove) await completeMove(moveId);
  }, [
    completeMove,
    dailyFocusMoveIds,
    dailyFocusPlan,
    dailyFocusMoves,
    hasAcceptedDailyPlan,
    maxMoves,
  ]);"""

if old_handle_complete not in text:
    raise SystemExit("❌ Could not find the exact handleComplete block. No changes written.")

text = text.replace(old_handle_complete, new_handle_complete, 1)

required = [
    "function markDailyFocusMoveDoneInPlan",
    "markDailyFocusMoveDoneInPlan(currentPlan || planForCompletion, moveId)",
    "acceptTodayDailyFocus(",
    "completeDailyFocusMove(moveId)",
    "setIsPlanningAction(false)",
]

for item in required:
    if item not in text:
        raise SystemExit(f"❌ Safety check failed: missing `{item}`. No changes written.")

if text.count("export default function YourMovesToday") != 1:
    raise SystemExit("❌ Safety check failed: YourMovesToday export count changed. No changes written.")

path.write_text(text)

print("✅ Daily Focus completion persistence patch applied.")
print("✅ Suggested moves now auto-lock before completion.")
print("✅ Completion stat should update immediately.")
print("✅ Completed moves should persist after refresh.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("rg -n \"markDailyFocusMoveDoneInPlan|const handleComplete|acceptTodayDailyFocus|completeDailyFocusMove\" src/components/focus/YourMovesToday.jsx -C 5")
