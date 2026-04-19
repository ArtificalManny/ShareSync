import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Activity } from '../activities/schemas/activity.schema';
import { Project } from '../projects/schemas/project.schema';

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  /**
   * Generate natural language narrative for user's week
   */
  async generateWeeklyNarrative(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
        createdAt: { $gte: weekAgo },
      })
      .lean();

    const lastWeekShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
        createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      })
      .lean();

    const thisWeekCount = thisWeekShips.length;
    const lastWeekCount = lastWeekShips.length;
    const change = thisWeekCount - lastWeekCount;

    let narrative = '';

    if (change > 0) {
      narrative = `You've shipped ${thisWeekCount} tasks this week (↑+${change} vs last week). `;
    } else if (change < 0) {
      narrative = `You've shipped ${thisWeekCount} tasks this week (${change} vs last week). `;
    } else {
      narrative = `You've shipped ${thisWeekCount} tasks this week (same as last week). `;
    }

    const hourCounts = thisWeekShips.reduce((acc, ship) => {
      const hour = new Date(ship.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topHourEntry = Object.entries(hourCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];

    if (topHourEntry) {
      const [hour] = topHourEntry;
      const timeLabel = this.formatTimeWindow(parseInt(hour));
      narrative += `Most work happened ${timeLabel} (your power hours). `;
    }

    return {
      narrative,
      stats: {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
        change,
      },
    };
  }

  /**
   * Generate predictive insights
   */
  async generatePredictions(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) return null;

    const now = new Date();
    const today = now.getDay();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
        createdAt: { $gte: weekAgo },
      })
      .lean();

    const dailyGoal = (user as any)?.preferences?.momentum?.dailyGoal ?? 5;
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayShips = thisWeekShips.filter(
      (s) => new Date(s.createdAt) >= todayStart,
    ).length;

    const predictions = [];

    // Prediction 1: Daily goal (reads user's setting)
    const remaining = dailyGoal - todayShips;
    if (remaining > 0 && remaining <= 3) {
      predictions.push({
        type: 'daily_goal',
        message: `�� If you ship ${remaining} more ${remaining === 1 ? 'task' : 'tasks'} today, you'll hit your daily goal`,
        confidence: 0.9,
      });
    }

    // Prediction 2: Beat Friday average
    if (today === 5) {
      const historicalFridays = await this.activityModel
        .find({
          userId,
          type: 'task.complete',
        })
        .lean();

      const fridayShips = historicalFridays.filter((s) => {
        const shipDate = new Date(s.createdAt);
        return shipDate.getDay() === 5;
      });

      const avgFridayShips =
        fridayShips.length > 0 ? Math.round(fridayShips.length / 4) : 3;

      if (todayShips + 2 >= avgFridayShips) {
        predictions.push({
          type: 'beat_average',
          message: `💡 If you ship 2 more today, you'll beat your usual Friday performance`,
          confidence: 0.85,
        });
      }
    }

    // Prediction 3: Streak protection
    const streakDays = user.streakDays || 0;
    if (streakDays >= 3 && todayShips === 0) {
      predictions.push({
        type: 'streak_protection',
        message: `⚠️ You haven't shipped today - one tiny task will protect your ${streakDays}d streak`,
        confidence: 0.95,
      });
    }

    return predictions;
  }

  /**
   * ⭐ NEW: Detect workload imbalance across user's projects
   */
  async detectWorkloadImbalance(userId: string) {
    const user = await this.userModel.findById(userId).populate('projects');
    if (!user || !user.projects) return [];

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const warnings = [];

    for (const project of user.projects as any[]) {
      const contributions = await this.activityModel.aggregate([
        {
          $match: {
            projectId: project._id.toString(),
            type: 'task.complete',
            createdAt: { $gte: weekAgo },
          },
        },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
          },
        },
      ]);

      const total = contributions.reduce((sum, c) => sum + c.count, 0);
      
      if (total === 0) continue; // Skip projects with no activity

      const userContribution = contributions.find(
        (c) => c._id === userId,
      );
      const userCount = userContribution?.count || 0;
      const userPercent = (userCount / total) * 100;

      // Alert if user is doing >60% of work in a multi-person project
      if (userPercent > 60 && contributions.length > 1) {
        warnings.push({
          projectId: project._id,
          projectName: project.title,
          userPercent: Math.round(userPercent),
          userTasks: userCount,
          totalTasks: total,
          severity: userPercent > 75 ? 'critical' : 'warning',
          message: `You're doing ${Math.round(userPercent)}% of ${project.title}'s work - this is unsustainable`,
          recommendation:
            userPercent > 75
              ? 'Redistribute tasks immediately to prevent burnout'
              : 'Consider rebalancing workload with your team',
        });
      }
    }

    return warnings.sort((a, b) => b.userPercent - a.userPercent);
  }

  /**
   * ⭐ NEW: Get critical insights for dashboard
   */
  async getCriticalInsights(userId: string) {
    const [predictions, workloadWarnings, user] = await Promise.all([
      this.generatePredictions(userId),
      this.detectWorkloadImbalance(userId),
      this.userModel.findById(userId).lean(),
    ]);

    const insights = [];

    // Priority 1: Workload imbalance (highest priority)
    if (workloadWarnings.length > 0) {
      const worst = workloadWarnings[0];
      insights.push({
        type: 'warning',
        priority: worst.severity === 'critical' ? 10 : 9,
        icon: 'users',
        color: worst.severity === 'critical' ? 'red' : 'amber',
        message: worst.message,
        action: {
          label: 'View team balance',
          link: `/projects/${worst.projectId}`,
        },
        data: worst,
      });
    }

    // Priority 2: Streak at risk
    if (predictions?.length > 0) {
      const streakPrediction = predictions.find(
        (p) => p.type === 'streak_protection',
      );
      if (streakPrediction) {
        insights.push({
          type: 'warning',
          priority: 10,
          icon: 'flame',
          color: 'red',
          message: streakPrediction.message,
          action: {
            label: 'Ship one task',
            link: '/projects',
          },
        });
      }
    }

    // Priority 3: Daily goal predictions
    if (predictions?.length > 0) {
      const goalPrediction = predictions.find((p) => p.type === 'daily_goal');
      if (goalPrediction) {
        insights.push({
          type: 'info',
          priority: 7,
          icon: 'target',
          color: 'blue',
          message: goalPrediction.message,
          action: {
            label: 'View projects',
            link: '/projects',
          },
        });
      }
    }

    // Priority 4: Peak time window
    const currentHour = new Date().getHours();
    const isPeakTime = currentHour >= 14 && currentHour <= 16;
    if (isPeakTime) {
      insights.push({
        type: 'success',
        priority: 8,
        icon: 'clock',
        color: 'purple',
        message: `It's ${currentHour}:00 - your peak productivity window for the next ${16 - currentHour} hours`,
        action: {
          label: 'Start deep work',
          link: '/focus',
        },
      });
    }

    // Sort by priority and return top 2
    return insights.sort((a, b) => b.priority - a.priority).slice(0, 2);
  }

  /**
   * Determine smart nudge timing
   */
  async getSmartNudgeTiming(userId: string) {
    const allShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
      })
      .lean();

    const hourCounts = allShips.reduce((acc, ship) => {
      const hour = new Date(ship.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const now = new Date();
    const currentHour = now.getHours();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const todayShips = allShips.filter(
      (s) => new Date(s.createdAt) >= todayStart,
    ).length;

    const userPrefs = await this.userModel.findById(userId).select('preferences').lean();
    const dailyGoal = (userPrefs as any)?.preferences?.momentum?.dailyGoal ?? 5;

    const shouldNudge =
      todayShips < dailyGoal &&
      topHours.includes(currentHour) &&
      todayShips === 0;

    return {
      shouldNudge,
      reason: shouldNudge
        ? `You're in your productive window (${this.formatTimeWindow(currentHour)}) and haven't shipped today`
        : null,
      bestTimes: topHours.map((h) => this.formatTimeWindow(h)),
      nextNudgeTime: this.calculateNextNudgeTime(topHours, currentHour),
    };
  }

  private formatTimeWindow(hour: number): string {
    if (hour < 12) return `${hour}am (mornings)`;
    if (hour < 17) return `${hour - 12}pm (afternoons)`;
    return `${hour - 12}pm (evenings)`;
  }

  private calculateNextNudgeTime(
    productiveHours: number[],
    currentHour: number,
  ): Date {
    const nextHour = productiveHours.find((h) => h > currentHour);
    const targetHour = nextHour || productiveHours[0];

    const nextNudge = new Date();
    nextNudge.setHours(targetHour, 0, 0, 0);

    if (targetHour <= currentHour) {
      nextNudge.setDate(nextNudge.getDate() + 1);
    }

    return nextNudge;
  }
}
