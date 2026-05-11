from pathlib import Path
from datetime import datetime

path = Path("src/daily-focus/daily-focus.service.ts")

if not path.exists():
    raise SystemExit("❌ Could not find src/daily-focus/daily-focus.service.ts. No changes made.")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"src/daily-focus/daily-focus.service.ts.bak-before-complete-persistence-{stamp}")
backup.write_text(original)

print(f"✅ Backup created: {backup}")

start_marker = "  async completeMove(\n"
end_marker = "\n  private async getOrCreatePlan("

start = text.find(start_marker)
if start == -1:
    raise SystemExit("❌ Could not find completeMove() start marker. No changes written.")

end = text.find(end_marker, start)
if end == -1:
    raise SystemExit("❌ Could not find getOrCreatePlan() marker after completeMove(). No changes written.")

old_block = text[start:end]

if old_block.count("async completeMove") != 1:
    raise SystemExit("❌ Safety check failed: completeMove block count is not exactly 1. No changes written.")

new_block = """  async completeMove(
    userId: string,
    moveId: string,
    timezone = 'UTC',
  ): Promise<DailyFocusResponse> {
    const userObjectId = this.toObjectId(userId, 'Invalid userId');
    const dateKey = this.getDateKey(timezone);

    const plan = await this.dailyFocusPlanModel
      .findOne({ userId: userObjectId, dateKey })
      .exec();

    if (!plan) {
      throw new NotFoundException('Daily focus plan not found');
    }

    const selectedMoves = [...(plan.selectedMoves || [])] as any[];
    const moveIndex = selectedMoves.findIndex((item) => item.id === moveId);

    if (moveIndex === -1) {
      throw new NotFoundException('Move not found');
    }

    const now = new Date();

    selectedMoves[moveIndex] = {
      ...(selectedMoves[moveIndex] as any),
      status: 'done',
      completedAt: (selectedMoves[moveIndex] as any).completedAt || now,
      updatedAt: now,
    };

    plan.selectedMoves = selectedMoves as any;

    const activeMoves = selectedMoves.filter(
      (item) => item.status !== 'dismissed',
    );

    plan.status =
      activeMoves.length > 0 && activeMoves.every((item) => item.status === 'done')
        ? 'completed'
        : 'accepted';

    // Important: force Mongoose to persist nested array changes.
    plan.markModified('selectedMoves');
    plan.markModified('status');

    await plan.save();

    this.logger.log(
      `Completed daily focus move ${moveId} for user ${userId}. Plan status: ${plan.status}`,
    );

    return this.getToday(userId, timezone);
  }
"""

fixed = text[:start] + new_block + text[end:]

required = [
    "const selectedMoves = [...(plan.selectedMoves || [])] as any[];",
    "const moveIndex = selectedMoves.findIndex((item) => item.id === moveId);",
    "plan.selectedMoves = selectedMoves as any;",
    "plan.markModified('selectedMoves');",
    "plan.markModified('status');",
    "Completed daily focus move",
]

for item in required:
    if item not in fixed:
        raise SystemExit(f"❌ Safety check failed: missing `{item}`. No changes written.")

if fixed.count("async completeMove(") != 1:
    raise SystemExit("❌ Safety check failed: completeMove count changed. No changes written.")

if fixed.count("private async getOrCreatePlan") != 1:
    raise SystemExit("❌ Safety check failed: getOrCreatePlan count changed. No changes written.")

path.write_text(fixed)

print("✅ DailyFocusService.completeMove() hardened.")
print("✅ selectedMoves now updates by array replacement.")
print("✅ Mongoose is explicitly told selectedMoves changed.")
print("✅ Plan status still becomes completed only when all active moves are done.")
print("✅ No frontend touched.")
print("")
print("Inspect with:")
print("sed -n '270,330p' src/daily-focus/daily-focus.service.ts")
