// /src/utils/generateAISuggestion.ts

export type ActivityInput = {
    streakDays?: number;           // current streak days
    totalXP?: number;              // lifetime XP
    tasksCompletedToday?: number;  // count today
    tasksThisWeek?: number;        // 7d tasks
    longestStreak?: number;        // optional
    taskCompletionRate?: number;   // 0..1 (optional)
  };
  
  export function generateAISuggestion(a: ActivityInput): string {
    const streak = a.streakDays ?? 0;
    const totalXP = a.totalXP ?? 0;
    const today = a.tasksCompletedToday ?? 0;
    const week = a.tasksThisWeek ?? 0;
    const tcr = a.taskCompletionRate ?? 0;
  
    // 1) Protect or extend streak
    if (streak === 0 && today === 0) {
      return "Start your momentum: complete 1 quick task in the next 15 minutes ⚡️";
    }
    if (streak > 0 && today === 0) {
      return `Keep the fire alive: complete 1 task today to protect your ${streak}-day streak 🔥`;
    }
    if (streak >= 7 && week < 10) {
      return "Great consistency. Batch 2–3 small tasks now to compound your weekly output 📈";
    }
  
    // 2) XP-based nudges
    if (totalXP < 500) {
      return "Level up faster: aim for 50 XP today with two focused pomodoros 🎯";
    }
    if (totalXP < 1000) {
      return "Push to Elite: ship 1 meaningful update and log it for quick XP gains 🌟";
    }
  
    // 3) Task completion health
    if (tcr < 0.4 && week >= 5) {
      return "Tidy your queue: close 2 stale tasks to boost completion rate 🧹";
    }
  
    // 4) Default encouragement
    return "Nice pace. Schedule a 25-minute deep-work block to lock in progress ⏱️";
  }
  