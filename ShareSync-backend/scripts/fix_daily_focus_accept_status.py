from pathlib import Path

path = Path("src/daily-focus/daily-focus.service.ts")
text = path.read_text()

old = """    const status = selectedMoves.every((move) => move.status === 'done')
      ? 'completed'
      : 'accepted';"""

new = """    // Newly accepted moves start as todo, so the plan enters accepted state.
    // The plan becomes completed later inside completeMove() after all selected moves are done.
    const status = 'accepted' as const;"""

if old not in text:
    marker = "selectedMoves.every"
    if marker in text:
        lines = text.splitlines()
        hit = next(i for i, line in enumerate(lines) if marker in line)
        print("Could not find exact block, but found selectedMoves.every near:")
        for i in range(max(0, hit - 8), min(len(lines), hit + 8)):
            print(f"{i+1:04d}: {lines[i]}")
    else:
        print("Could not find selectedMoves.every in daily-focus.service.ts.")
    raise SystemExit("No changes written.")

text = text.replace(old, new, 1)

if "selectedMoves.every((move) => move.status === 'done')" in text:
    raise SystemExit("Safety check failed: old impossible comparison still exists. No changes written.")

if "const status = 'accepted' as const;" not in text:
    raise SystemExit("Safety check failed: accepted status replacement missing. No changes written.")

path.write_text(text)

print("✅ Fixed DailyFocus accept status TypeScript error.")
print("✅ Accepted plans now enter status='accepted'.")
print("✅ Completion remains handled later by completeMove().")
