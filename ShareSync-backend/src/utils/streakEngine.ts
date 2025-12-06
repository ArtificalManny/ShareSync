// src/utils/streakEngine.ts

export interface StreakEvent {
  timestamp: Date | string;
}

export interface StreakStats {
  /** How many consecutive days up to today the user has been active */
  currentStreak: number;
  /** Longest ever consecutive-day streak */
  longestStreak: number;
  /** Date (midnight) of the last active day */
  lastActiveAt: Date | null;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDayNumber(timestamp: Date | string): number {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // “Day number” since Unix epoch
  return Math.floor(d.getTime() / MS_PER_DAY);
}

function dayNumberToDate(dayNumber: number): Date {
  return new Date(dayNumber * MS_PER_DAY);
}

/**
 * Calculate streak info from a list of activity events.
 *
 * - currentStreak counts consecutive days up to *today*.
 * - longestStreak is the max consecutive-day run in history.
 */
export function calculateStreak(events: StreakEvent[]): StreakStats {
  if (!events || events.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: null,
    };
  }

  // Unique days as integers
  const dayNumbers = Array.from(
    new Set(events.map((e) => toDayNumber(e.timestamp)))
  ).sort((a, b) => a - b);

  const lastDayNum = dayNumbers[dayNumbers.length - 1];
  const lastActiveAt = dayNumberToDate(lastDayNum);

  // Longest streak (single forward pass)
  let longestStreak = 1;
  let run = 1;

  for (let i = 1; i < dayNumbers.length; i++) {
    if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longestStreak) {
      longestStreak = run;
    }
  }

  // Current streak: counting backwards from *today* as long as days are consecutive
  const todayNum = toDayNumber(new Date());
  let currentStreak = 0;

  if (lastDayNum === todayNum) {
    // User was active today → walk backward while consecutive
    currentStreak = 1;
    for (let i = dayNumbers.length - 2; i >= 0; i--) {
      if (dayNumbers[i] === dayNumbers[i + 1] - 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  } else {
    // If you ever want to allow “up to yesterday” as still active, you can
    // loosen this condition:
    // if (lastDayNum === todayNum - 1) { ...same logic... }
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveAt,
  };
}
