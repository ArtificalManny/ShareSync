from pathlib import Path
import re

module_path = Path("src/user/user.module.ts")
service_path = Path("src/user/user.service.ts")
controller_path = Path("src/user/user.controller.ts")

for path in [module_path, service_path, controller_path]:
    if not path.exists():
        raise SystemExit(f"Missing file: {path}")

# ─────────────────────────────────────────────────────────────
# 1) UserModule: register Task model so UserService can calculate stats.
# ─────────────────────────────────────────────────────────────
module = module_path.read_text()

if "../tasks/schemas/task.schema" not in module:
    module = module.replace(
        "import { User, UserSchema } from './schemas/user.schema';",
        "import { User, UserSchema } from './schemas/user.schema';\n"
        "import { Task, TaskSchema } from '../tasks/schemas/task.schema';"
    )

old_for_feature = "MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),"
new_for_feature = """MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
    ]),"""

if "Task.name, schema: TaskSchema" not in module:
    if old_for_feature not in module:
        raise SystemExit("Could not find UserModule MongooseModule.forFeature anchor.")
    module = module.replace(old_for_feature, new_for_feature)

module_path.write_text(module)

# ─────────────────────────────────────────────────────────────
# 2) UserService: inject Task model + add getMyStats().
# ─────────────────────────────────────────────────────────────
service = service_path.read_text()

if "../tasks/schemas/task.schema" not in service:
    # Add Task import near User schema import.
    service = service.replace(
        "import { User, UserDocument } from './schemas/user.schema';",
        "import { User, UserDocument } from './schemas/user.schema';\n"
        "import { Task, TaskDocument } from '../tasks/schemas/task.schema';"
    )

# Ensure mongoose import includes Types.
service = re.sub(
    r"import\s+\{([^}]*\bModel\b[^}]*)\}\s+from\s+'mongoose';",
    lambda m: (
        "import {" +
        (m.group(1) if "Types" in m.group(1) else m.group(1).rstrip() + ", Types") +
        "} from 'mongoose';"
    ),
    service,
    count=1,
)

if "private readonly taskModel" not in service:
    old_injection = """    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,"""

    new_injection = """    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,"""

    if old_injection not in service:
        raise SystemExit("Could not find UserService userModel injection anchor.")

    service = service.replace(old_injection, new_injection, 1)

stats_methods = """
  private getStatsDate(value: any): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getStatsDayKey(value: any): string | null {
    const date = this.getStatsDate(value);
    if (!date) return null;

    return date.toISOString().slice(0, 10);
  }

  private calculateCurrentStreakFromCompletedTasks(tasks: any[]): number {
    const dayKeys = new Set<string>();

    for (const task of Array.isArray(tasks) ? tasks : []) {
      const key = this.getStatsDayKey(task?.completedAt);
      if (key) dayKeys.add(key);
    }

    if (dayKeys.size === 0) return 0;

    const cursor = new Date();
    let streak = 0;

    while (true) {
      const key = cursor.toISOString().slice(0, 10);

      if (!dayKeys.has(key)) {
        break;
      }

      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streak;
  }

  async getMyStats(userId: string): Promise<any> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const oid = new Types.ObjectId(userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const userActivityQuery = {
      $or: [
        { completedBy: oid },
        { assigneeId: oid },
        { assignee: oid },
        { createdBy: oid },
        { reporterId: oid },
        { reporter: oid },
      ],
    };

    const completedStatusQuery = {
      status: { $in: ['done', 'completed', 'DONE', 'COMPLETED'] },
      completedAt: { $exists: true, $ne: null },
    };

    const [user, completedTasks, recentRelevantCount] = await Promise.all([
      this.userModel
        .findById(oid)
        .select('totalShips streakDays currentStreak longestStreak xp level')
        .lean()
        .exec(),

      this.taskModel
        .find({
          $and: [userActivityQuery, completedStatusQuery],
        })
        .select('_id status completedAt completedBy assigneeId createdBy reporterId')
        .lean()
        .exec(),

      this.taskModel
        .countDocuments({
          $and: [
            userActivityQuery,
            {
              $or: [
                { createdAt: { $gte: sevenDaysAgo } },
                { updatedAt: { $gte: sevenDaysAgo } },
                { completedAt: { $gte: sevenDaysAgo } },
              ],
            },
          ],
        })
        .exec(),
    ]);

    const totalShipsFromTasks = completedTasks.length;

    const weeklyShips = completedTasks.filter((task: any) => {
      const completedAt = this.getStatsDate(task?.completedAt);
      return completedAt && completedAt >= sevenDaysAgo;
    }).length;

    const previousWeekShips = completedTasks.filter((task: any) => {
      const completedAt = this.getStatsDate(task?.completedAt);
      return completedAt && completedAt >= fourteenDaysAgo && completedAt < sevenDaysAgo;
    }).length;

    const activeDaysThisWeek = new Set(
      completedTasks
        .filter((task: any) => {
          const completedAt = this.getStatsDate(task?.completedAt);
          return completedAt && completedAt >= sevenDaysAgo;
        })
        .map((task: any) => this.getStatsDayKey(task?.completedAt))
        .filter(Boolean),
    ).size;

    const calculatedStreak = this.calculateCurrentStreakFromCompletedTasks(completedTasks);
    const persistedStreak = Number((user as any)?.streakDays ?? (user as any)?.currentStreak ?? 0);
    const persistedTotalShips = Number((user as any)?.totalShips ?? 0);

    const totalShips = Math.max(totalShipsFromTasks, persistedTotalShips);
    const streakDays = Math.max(calculatedStreak, persistedStreak);

    const focus =
      recentRelevantCount > 0
        ? Math.min(100, Math.round((weeklyShips / recentRelevantCount) * 100))
        : weeklyShips > 0
          ? 100
          : 0;

    const efficiency =
      previousWeekShips === 0
        ? weeklyShips > 0
          ? 100
          : 0
        : Math.round(((weeklyShips - previousWeekShips) / previousWeekShips) * 100);

    return {
      ships: totalShips,
      totalShips,
      shipCount: totalShips,

      weeklyShips,
      shipsThisWeek: weeklyShips,
      shippedThisWeek: weeklyShips,

      lastWeekShips: previousWeekShips,
      activeDaysThisWeek,

      streakDays,
      currentStreak: streakDays,
      longestStreak: Number((user as any)?.longestStreak ?? streakDays),

      focus,
      completionRate: focus,
      efficiency,

      xp: Number((user as any)?.xp ?? 0),
      level: Number((user as any)?.level ?? 1),

      updatedAt: new Date().toISOString(),
    };
  }

"""

if "async getMyStats(userId: string)" not in service:
    anchor = "  // ═══════════════════════════════════════════════════════════════════════════\n  // FIND METHODS"
    if anchor not in service:
        raise SystemExit("Could not find UserService FIND METHODS anchor.")
    service = service.replace(anchor, stats_methods + "\n" + anchor, 1)

service_path.write_text(service)

# ─────────────────────────────────────────────────────────────
# 3) UserController: expose GET /users/me/stats.
# ─────────────────────────────────────────────────────────────
controller = controller_path.read_text()

stats_endpoint = """
  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    return {
      success: true,
      data: await this.users.getMyStats(userId),
    };
  }

"""

if "@Get('me/stats')" not in controller:
    anchor = "  @UseGuards(JwtAuthGuard)\n  @Post('me/avatar')"
    if anchor not in controller:
        raise SystemExit("Could not find avatar endpoint anchor in UserController.")
    controller = controller.replace(anchor, stats_endpoint + anchor, 1)

controller_path.write_text(controller)

print("Added GET /users/me/stats backend endpoint.")
