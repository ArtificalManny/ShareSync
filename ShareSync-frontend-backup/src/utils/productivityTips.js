// /src/utils/productivityTips.js

export function getRandomTip(streakDays = 0, xp = 0) {
  let tips = []

  if (streakDays >= 7 && xp >= 1000) {
    // 🔥 High-tier user
    tips = [
      "You're in elite mode — challenge yourself to a 10-day streak!",
      "Mastery isn't a moment. It's your habit. Keep going.",
      "You're showing up daily — now refine your focus.",
      "Stack your wins. One optimized hour can lead to exponential returns."
    ]
  } else if (streakDays >= 3 || xp >= 500) {
    // 🌱 Mid-tier user
    tips = [
      "Momentum is real — a few more days unlock your next tier.",
      "Stay consistent. You’re right on the edge of a breakthrough.",
      "Three days strong — now aim for five!",
      "Don’t break the chain — today’s the most important day."
    ]
  } else {
    // 🚀 New or reactivating users
    tips = [
      "Getting started is the hardest part — you're doing great.",
      "A single win today builds tomorrow’s habits.",
      "Complete just one task — small moves unlock momentum.",
      "Every streak starts at day one. Let’s get rolling!"
    ]
  }

  // Shuffle and return one
  const randomIndex = Math.floor(Math.random() * tips.length)
  return tips[randomIndex]
}
