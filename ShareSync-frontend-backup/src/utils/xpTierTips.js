// src/utils/xpTierTips.js
export const getTierTip = (xp) => {
    if (xp < 100) return "🔥 3 more tasks to unlock your next tier!";
    if (xp < 250) return "💡 You're building momentum. Keep up the daily streaks!";
    if (xp < 500) return "🚀 Just a few milestones away from becoming *Elite*.";
    if (xp < 1000) return "🧠 Consider mentoring a teammate or leading a project.";
    return "👑 You're a legend. Share your wisdom in the forums!";
  };
  