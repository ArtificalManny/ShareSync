// src/utils/mockStreakAnalytics.js
export const getMockStreakAnalytics = () => {
    return {
      weekly: [1, 1, 0, 1, 1, 1, 0], // Days active in the past 7 days
      monthly: Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? 1 : 0)) // Active every other day
    };
  };  