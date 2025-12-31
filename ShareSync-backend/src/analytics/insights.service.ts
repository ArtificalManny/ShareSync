import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Activity } from '../activities/schemas/activity.schema';

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  /**
   * Generate natural language narrative for user's week
   */
  async generateWeeklyNarrative(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get this week's ships (task completions)
    const thisWeekShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
        createdAt: { $gte: weekAgo },
      })
      .lean();

    // Get last week's ships for comparison
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

    // Determine tone
    let narrative = '';

    if (change > 0) {
      narrative = `You've shipped ${thisWeekCount} tasks this week (↑+${change} vs last week). `;
    } else if (change < 0) {
      narrative = `You've shipped ${thisWeekCount} tasks this week (${change} vs last week). `;
    } else {
      narrative = `You've shipped ${thisWeekCount} tasks this week (same as last week). `;
    }

    // Add time pattern insight
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
    const today = now.getDay(); // 0 = Sunday, 6 = Saturday
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
        createdAt: { $gte: weekAgo },
      })
      .lean();

    const dailyGoal = 5; // Default goal
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayShips = thisWeekShips.filter(
      (s) => new Date(s.createdAt) >= todayStart,
    ).length;

    const predictions = [];

    // Prediction 1: Daily goal
    const remaining = dailyGoal - todayShips;
    if (remaining > 0 && remaining <= 3) {
      predictions.push({
        type: 'daily_goal',
        message: `💡 If you ship ${remaining} more ${remaining === 1 ? 'task' : 'tasks'} today, you'll hit your daily goal`,
        confidence: 0.9,
      });
    }

    // Prediction 2: Beat your Friday average
    if (today === 5) {
      // Friday
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
   * Determine smart nudge timing
   */
  async getSmartNudgeTiming(userId: string) {
    // Get all historical ships to analyze patterns
    const allShips = await this.activityModel
      .find({
        userId,
        type: 'task.complete',
      })
      .lean();

    // Analyze historical ship times
    const hourCounts = allShips.reduce((acc, ship) => {
      const hour = new Date(ship.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Find top 3 productive hours
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

    const dailyGoal = 5;

    // Should we nudge now?
    const shouldNudge =
      todayShips < dailyGoal && // Haven't hit goal
      topHours.includes(currentHour) && // In a productive hour
      todayShips === 0; // Haven't started yet

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
    // Find next productive hour
    const nextHour = productiveHours.find((h) => h > currentHour);
    const targetHour = nextHour || productiveHours[0];

    const nextNudge = new Date();
    nextNudge.setHours(targetHour, 0, 0, 0);

    // If target is earlier than current time, schedule for tomorrow
    if (targetHour <= currentHour) {
      nextNudge.setDate(nextNudge.getDate() + 1);
    }

    return nextNudge;
  }
}
