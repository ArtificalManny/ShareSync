// /src/utils/generateDailyGoal.js

export function generateDailyGoal(streakDays = 0, tasksCompleted = 0) {
    if (streakDays < 3) {
      return "✅ Complete at least 1 task today to build your streak!";
    } else if (streakDays < 7) {
      return `🔥 Keep it going! Aim for 2+ tasks to extend your ${streakDays}-day streak.`;
    } else if (streakDays < 30) {
      return `🚀 You're crushing it! Try to hit 3+ tasks to push toward elite status.`;
    } else {
      return `👑 You're elite. Inspire others by completing 5+ tasks today.`;
    }
  }  