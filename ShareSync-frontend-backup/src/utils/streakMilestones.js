export const getStreakMilestone = (streakDays) => {
    if (streakDays >= 30) return 30;
    if (streakDays >= 10) return 10;
    if (streakDays >= 5) return 5;
    if (streakDays >= 3) return 3;
    return null;
  };
  