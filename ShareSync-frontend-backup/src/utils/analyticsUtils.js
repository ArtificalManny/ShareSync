// src/utils/analyticsUtils.js

// Utility: Generate AI Goal Message
export function getAIGoal(streakDays = 0, xp = 0, today = new Date()) {
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' })

  if (streakDays === 0 && weekday === 'Monday') {
    return 'Reach a 3-day streak by Friday!'
  }

  if (streakDays >= 21) {
    return 'Maintain your high streak and begin mentoring others!'
  } else if (streakDays >= 14) {
    return 'You’re in a strong groove! Aim to complete 2 priority tasks daily.'
  } else if (streakDays >= 7) {
    return 'Build on this momentum. Stay above 1 task/day to level up.'
  } else if (streakDays >= 3) {
    return 'Great start! Keep it steady — don’t break the chain.'
  } else {
    return xp >= 50
      ? 'You’ve got XP — now aim for a 3-day streak.'
      : 'Try completing 1 task daily for the next 3 days. Small wins add up!'
  }
}

// Utility: Calculate today's task target
export function getDailyTarget(tasksCompleted = 0) {
  const target = Math.max(2, Math.floor(tasksCompleted / 5))
  return `Complete at least ${target} tasks today!`
}

// Utility: Find most productive day
export function getMostProductiveDay(completedTasks = []) {
  const countsByDay = {}

  completedTasks.forEach(entry => {
    const day = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })
    countsByDay[day] = (countsByDay[day] || 0) + entry.count
  })

  let mostProductive = ''
  let max = 0

  Object.entries(countsByDay).forEach(([day, count]) => {
    if (count > max) {
      max = count
      mostProductive = day
    }
  })

  return mostProductive || 'Wednesday'
}

// 🔮 NEW: AI Suggestion logic based on streak, XP, and task data
export function getSmartTip({ streakDays = 0, xp = 0, tasksCompletedThisWeek = 0 }) {
  // Tiered tip bank
  const lowTierTips = [
    'Complete 1 task a day for 3 days straight. You’ve got this!',
    'Break your big task into 3 smaller ones — and complete one today.',
    'Not sure where to start? Try adding a 5-minute task right now.'
  ]

  const midTierTips = [
    'You’re gaining steam. Set a mini goal for this week.',
    'Great streak — now aim to complete your toughest task early today.',
    'Start your day with the easiest task to build momentum.'
  ]

  const highTierTips = [
    '🔥 You’re in elite mode. Try mentoring a teammate or starting a new project.',
    'You’ve unlocked Momentum Flow — time to push a little harder.',
    'Aim for a perfect week. Can you keep your streak unbroken for 7 more days?'
  ]

  // Choose tier
  if (streakDays >= 21 || xp >= 500) {
    return highTierTips[Math.floor(Math.random() * highTierTips.length)]
  }

  if (streakDays >= 7 || xp >= 150 || tasksCompletedThisWeek >= 10) {
    return midTierTips[Math.floor(Math.random() * midTierTips.length)]
  }

  return lowTierTips[Math.floor(Math.random() * lowTierTips.length)]
}