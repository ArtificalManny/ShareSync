#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
CONTROLLER = ROOT / "src/user/user.controller.ts"
SERVICE = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message):
    print(f"\n[add_weekly_rhythm_endpoint_v2] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-weekly-rhythm-v2-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[add_weekly_rhythm_endpoint_v2] backup created: {backup_path}")


def patch_controller():
    if not CONTROLLER.exists():
        fail(f"Missing controller: {CONTROLLER}")

    source = CONTROLLER.read_text(encoding="utf-8")

    required = [
        "@Controller('users')",
        "export class UserController",
        "async getActivitySummary(@Req() req: any)",
        "return this.users.getActivitySummary(userId);",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Controller missing expected marker: {marker}")

    if "weekly-rhythm" in source and "getWeeklyRhythm" in source:
        print("[add_weekly_rhythm_endpoint_v2] controller already has weekly-rhythm route")
        return False

    anchor = """  @UseGuards(JwtAuthGuard)
  @Get('activity-summary')
  async getActivitySummary(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.getActivitySummary(userId);
  }

"""

    insert = """  @UseGuards(JwtAuthGuard)
  @Get('me/weekly-rhythm')
  async getMyWeeklyRhythm(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.getWeeklyRhythm(userId);
  }

  // Backwards-compatible alias in case any client calls /users/weekly-rhythm.
  @UseGuards(JwtAuthGuard)
  @Get('weekly-rhythm')
  async getWeeklyRhythm(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    return this.users.getWeeklyRhythm(userId);
  }

"""

    if anchor not in source:
        fail("Could not find exact activity-summary route block. No controller changes written.")

    updated = source.replace(anchor, anchor + insert, 1)

    required_after = [
        "@Get('me/weekly-rhythm')",
        "@Get('weekly-rhythm')",
        "return this.users.getWeeklyRhythm(userId);",
    ]

    for marker in required_after:
        if marker not in updated:
            fail(f"Controller safety check failed after patch. Missing: {marker}")

    backup(CONTROLLER)
    CONTROLLER.write_text(updated, encoding="utf-8")
    print(f"[add_weekly_rhythm_endpoint_v2] patched controller: {CONTROLLER}")
    return True


def patch_service():
    if not SERVICE.exists():
        fail(f"Missing service: {SERVICE}")

    source = SERVICE.read_text(encoding="utf-8")

    required = [
        "export class UserService",
        "private readonly activities: ActivitiesService",
        "async getActivitySummary(userId: string): Promise<any>",
        "this.activities.list",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Service missing expected marker: {marker}")

    if "async getWeeklyRhythm(userId: string): Promise<any>" in source:
        print("[add_weekly_rhythm_endpoint_v2] service already has getWeeklyRhythm")
        return False

    anchor = """  async getActivitySummary(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    const baseXp = (user as any).xp ?? (user as any).points ?? 0;
    const { items } = await this.activities.list({ scope: 'user', userId, range: '30d', cursor: null, limit: 500 });
    const summary = buildActivitySummary(items.map((a: any) => ({ timestamp: a.createdAt || a.ts, type: a.type || a.eventType || 'UNKNOWN', xpDelta: a.xpDelta ?? a.meta?.xpDelta ?? 0 })), baseXp);
    return summary;
  }

"""

    insert = """  async getWeeklyRhythm(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();

    const startOfDay = (input: Date) => {
      const d = new Date(input);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const addDays = (input: Date, days: number) => {
      const d = new Date(input);
      d.setDate(d.getDate() + days);
      return d;
    };

    const toISODate = (input: Date) => input.toISOString().slice(0, 10);

    // Monday-start week. JS Sunday is 0, so convert Sunday to 6.
    const today = startOfDay(now);
    const mondayOffset = (today.getDay() + 6) % 7;
    const weekStart = addDays(today, -mondayOffset);
    const weekEndExclusive = addDays(weekStart, 7);
    const lastWeekStart = addDays(weekStart, -7);

    const isShipLikeActivity = (activity: any) => {
      const rawType = String(activity?.type || activity?.eventType || '').toUpperCase();
      const rawAction = String(activity?.action || activity?.verb || '').toUpperCase();
      const rawStatus = String(activity?.status || activity?.payload?.status || activity?.meta?.status || '').toUpperCase();
      const rawTitle = String(activity?.title || activity?.message || activity?.label || '').toUpperCase();

      return (
        rawType === 'TASK_COMPLETED' ||
        rawType === 'TASK_COMPLETE' ||
        rawType === 'TASK_DONE' ||
        rawType === 'TASK_SHIPPED' ||
        rawType === 'SHIP' ||
        rawType === 'SHIPPED' ||
        rawAction.includes('COMPLETE') ||
        rawAction.includes('SHIP') ||
        rawStatus === 'DONE' ||
        rawStatus === 'COMPLETED' ||
        rawTitle.includes('COMPLETED') ||
        rawTitle.includes('SHIPPED')
      );
    };

    const getTimestamp = (activity: any) => {
      const value =
        activity?.completedAt ||
        activity?.createdAt ||
        activity?.updatedAt ||
        activity?.ts ||
        activity?.timestamp;

      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    };

    // Reuse the existing activity pipeline instead of adding new Mongoose model wiring.
    const { items } = await this.activities.list({
      scope: 'user',
      userId,
      range: '30d',
      cursor: null,
      limit: 1000,
    });

    const weekCounts = new Map<string, number>();
    const lastWeekCounts = new Map<string, number>();

    for (const activity of items || []) {
      if (!isShipLikeActivity(activity)) continue;

      const ts = getTimestamp(activity);
      if (!ts) continue;

      if (ts >= weekStart && ts < weekEndExclusive) {
        const key = toISODate(ts);
        weekCounts.set(key, (weekCounts.get(key) || 0) + 1);
      }

      if (ts >= lastWeekStart && ts < weekStart) {
        const key = toISODate(ts);
        lastWeekCounts.set(key, (lastWeekCounts.get(key) || 0) + 1);
      }
    }

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(weekStart, index);
      const key = toISODate(date);

      return {
        date: key,
        day: dayLabels[index],
        count: weekCounts.get(key) || 0,
        isToday: key === toISODate(today),
      };
    });

    const thisWeekTotal = days.reduce((sum, day) => sum + day.count, 0);
    const lastWeekTotal = Array.from(lastWeekCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const activeDays = days.filter((day) => day.count > 0).length;
    const peakDay = days.reduce(
      (best, day) => (day.count > best.count ? day : best),
      { date: null, day: '', count: 0 } as any,
    );

    let momentum = 'warming';
    let momentumLabel = 'Warming up';

    if (thisWeekTotal > 0 && lastWeekTotal === 0) {
      momentum = 'rising';
      momentumLabel = 'Rising';
    } else if (thisWeekTotal > lastWeekTotal) {
      momentum = 'rising';
      momentumLabel = 'Rising';
    } else if (thisWeekTotal === lastWeekTotal && thisWeekTotal > 0) {
      momentum = 'steady';
      momentumLabel = 'Steady';
    } else if (thisWeekTotal < lastWeekTotal && thisWeekTotal > 0) {
      momentum = 'cooling';
      momentumLabel = 'Cooling';
    }

    const insight =
      thisWeekTotal > 0
        ? `You shipped ${thisWeekTotal} item${thisWeekTotal === 1 ? '' : 's'} across ${activeDays} active day${activeDays === 1 ? '' : 's'} this week.`
        : 'Your weekly rhythm will appear here once you start shipping activity this week.';

    return {
      days,
      momentum,
      momentumLabel,
      peakDay,
      thisWeekTotal,
      activeDays,
      totalDays: 7,
      lastWeekTotal,
      insight,
      source: 'backend',
    };
  }

"""

    if anchor not in source:
        fail("Could not find exact getActivitySummary method block. No service changes written.")

    updated = source.replace(anchor, anchor + insert, 1)

    required_after = [
        "async getWeeklyRhythm(userId: string): Promise<any>",
        "this.activities.list",
        "scope: 'user'",
        "range: '30d'",
        "TASK_COMPLETED",
        "TASK_SHIPPED",
        "thisWeekTotal",
        "momentumLabel",
        "source: 'backend'",
    ]

    for marker in required_after:
        if marker not in updated:
            fail(f"Service safety check failed after patch. Missing: {marker}")

    backup(SERVICE)
    SERVICE.write_text(updated, encoding="utf-8")
    print(f"[add_weekly_rhythm_endpoint_v2] patched service: {SERVICE}")
    return True


def main():
    print("[add_weekly_rhythm_endpoint_v2] starting")

    changed_controller = patch_controller()
    changed_service = patch_service()

    if not changed_controller and not changed_service:
        fail("No files were changed.")

    print("")
    print("[add_weekly_rhythm_endpoint_v2] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"weekly-rhythm|getWeeklyRhythm|thisWeekTotal|momentumLabel|TASK_SHIPPED|source: 'backend'\" src/user -C 6")
    print("")
    print("Then restart your backend dev server.")
    print("After that, hard refresh the frontend with Cmd + Shift + R.")


if __name__ == "__main__":
    main()
