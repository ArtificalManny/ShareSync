// src/utils/predictionEngine.js
/**
 * Prediction Engine - ML-powered pattern analysis
 * 
 * Analyzes user behavior patterns to predict next actions:
 * - Time-based patterns (e.g., "Every Monday 9am → reports")
 * - Sequence-based patterns (e.g., "Design done → usually code next")
 * - Context-based patterns (e.g., "High energy → tackle bugs")
 * - Social-based patterns (e.g., "Sarah ships → you review")
 * 
 * Competitive Moat: Proactive, not reactive
 */

/**
 * Analyze patterns and generate predictions
 */
export async function analyzePatternsAndPredict() {
  try {
    const [
      timePatterns,
      sequencePatterns,
      contextPatterns,
      socialPatterns,
    ] = await Promise.all([
      analyzeTimeBasedPatterns(),
      analyzeSequenceBasedPatterns(),
      analyzeContextBasedPatterns(),
      analyzeSocialBasedPatterns(),
    ]);

    // Combine all patterns and rank by confidence
    const allPredictions = [
      ...timePatterns,
      ...sequencePatterns,
      ...contextPatterns,
      ...socialPatterns,
    ];

    // Sort by confidence (highest first)
    allPredictions.sort((a, b) => b.confidence - a.confidence);

    // Return top prediction if confidence >= 70%
    if (allPredictions.length > 0 && allPredictions[0].confidence >= 70) {
      return allPredictions[0];
    }

    return null;
  } catch (error) {
    console.error('[analyzePatternsAndPredict] Error:', error);
    return null;
  }
}

// ====================================================================
// TIME-BASED PATTERNS
// ====================================================================

/**
 * Analyze time-based patterns
 * Example: "Every Monday 9am, you work on reports"
 */
async function analyzeTimeBasedPatterns() {
  try {
    const history = getActionHistory();
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0-6 (Sun-Sat)
    const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay];

    const predictions = [];

    // Find actions that repeatedly happen at this time
    const timeSlotActions = history.filter(action => {
      const actionDate = new Date(action.timestamp);
      const actionHour = actionDate.getHours();
      const actionDay = actionDate.getDay();
      
      // Same day of week AND same hour (±1 hour tolerance)
      return actionDay === currentDay && Math.abs(actionHour - currentHour) <= 1;
    });

    if (timeSlotActions.length >= 3) {
      // Group by action type
      const actionCounts = {};
      timeSlotActions.forEach(action => {
        actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
      });

      // Find most common action
      const mostCommon = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (mostCommon) {
        const [actionType, count] = mostCommon;
        const confidence = Math.min(95, (count / timeSlotActions.length) * 100);

        predictions.push({
          type: 'time-based',
          actionType,
          label: `You usually work on ${actionType} now`,
          message: `${currentDayName}s at ${formatHour(currentHour)} → ${actionType}`,
          confidence: Math.round(confidence),
          icon: getIconForActionType(actionType),
          color: 'text-purple-500',
          pattern: 'recurring-time',
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('[analyzeTimeBasedPatterns] Error:', error);
    return [];
  }
}

// ====================================================================
// SEQUENCE-BASED PATTERNS
// ====================================================================

/**
 * Analyze sequence-based patterns
 * Example: "After finishing design, you usually code"
 */
async function analyzeSequenceBasedPatterns() {
  try {
    const history = getActionHistory();
    const recentCompletions = getRecentCompletions();
    
    if (recentCompletions.length === 0) return [];

    const predictions = [];
    const lastCompletion = recentCompletions[0];

    // Find what user did after similar completions in the past
    const sequences = [];
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];
      
      // If this action matches recent completion
      if (current.type === lastCompletion.type) {
        // Record what came next
        const timeDiff = new Date(next.timestamp) - new Date(current.timestamp);
        
        // Only consider actions within 2 hours
        if (timeDiff <= 2 * 60 * 60 * 1000) {
          sequences.push(next.type);
        }
      }
    }

    if (sequences.length >= 2) {
      // Find most common next action
      const actionCounts = {};
      sequences.forEach(type => {
        actionCounts[type] = (actionCounts[type] || 0) + 1;
      });

      const mostCommon = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (mostCommon) {
        const [actionType, count] = mostCommon;
        const confidence = Math.min(95, (count / sequences.length) * 100);

        predictions.push({
          type: 'sequence-based',
          actionType,
          label: `Ready to ${actionType}?`,
          message: `You finished ${lastCompletion.type} → usually ${actionType} next`,
          confidence: Math.round(confidence),
          icon: getIconForActionType(actionType),
          color: 'text-blue-500',
          pattern: 'completion-sequence',
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('[analyzeSequenceBasedPatterns] Error:', error);
    return [];
  }
}

// ====================================================================
// CONTEXT-BASED PATTERNS
// ====================================================================

/**
 * Analyze context-based patterns
 * Example: "When energy is high, you tackle bugs"
 */
async function analyzeContextBasedPatterns() {
  try {
    const history = getActionHistory();
    const currentEnergy = getCurrentEnergyLevel();
    const currentTime = getTimeOfDay();

    const predictions = [];

    // Find actions done in similar context
    const contextMatches = history.filter(action => {
      return action.energyLevel === currentEnergy && action.timeOfDay === currentTime;
    });

    if (contextMatches.length >= 3) {
      // Group by action type
      const actionCounts = {};
      contextMatches.forEach(action => {
        actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
      });

      const mostCommon = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (mostCommon) {
        const [actionType, count] = mostCommon;
        const confidence = Math.min(95, (count / contextMatches.length) * 100);

        predictions.push({
          type: 'context-based',
          actionType,
          label: `Time to ${actionType}?`,
          message: `${currentEnergy} energy + ${currentTime} → usually ${actionType}`,
          confidence: Math.round(confidence),
          icon: getIconForActionType(actionType),
          color: 'text-green-500',
          pattern: 'energy-time-match',
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('[analyzeContextBasedPatterns] Error:', error);
    return [];
  }
}

// ====================================================================
// SOCIAL-BASED PATTERNS
// ====================================================================

/**
 * Analyze social-based patterns
 * Example: "When Sarah ships, you usually review"
 */
async function analyzeSocialBasedPatterns() {
  try {
    const history = getActionHistory();
    const recentTeamActivity = await getRecentTeamActivity();
    
    if (recentTeamActivity.length === 0) return [];

    const predictions = [];
    const lastTeamAction = recentTeamActivity[0];

    // Find what user did after similar team actions
    const socialSequences = [];
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      
      // If this was triggered by team action
      if (current.trigger === 'team-activity' && current.teamMember === lastTeamAction.member) {
        socialSequences.push(current.type);
      }
    }

    if (socialSequences.length >= 2) {
      const actionCounts = {};
      socialSequences.forEach(type => {
        actionCounts[type] = (actionCounts[type] || 0) + 1;
      });

      const mostCommon = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (mostCommon) {
        const [actionType, count] = mostCommon;
        const confidence = Math.min(95, (count / socialSequences.length) * 100);

        predictions.push({
          type: 'social-based',
          actionType,
          label: `Review ${lastTeamAction.member}'s work?`,
          message: `${lastTeamAction.member} shipped → you usually review`,
          confidence: Math.round(confidence),
          icon: '👥',
          color: 'text-orange-500',
          pattern: 'teammate-trigger',
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('[analyzeSocialBasedPatterns] Error:', error);
    return [];
  }
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Get action history from localStorage
 */
function getActionHistory() {
  try {
    const stored = localStorage.getItem('ss.action_history');
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    
    // Only keep last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return history.filter(action => action.timestamp > thirtyDaysAgo);
  } catch (error) {
    console.error('[getActionHistory] Error:', error);
    return [];
  }
}

/**
 * Record user action for pattern learning
 */
export function recordAction(actionType, metadata = {}) {
  try {
    const history = getActionHistory();
    
    const action = {
      type: actionType,
      timestamp: Date.now(),
      energyLevel: getCurrentEnergyLevel(),
      timeOfDay: getTimeOfDay(),
      ...metadata,
    };

    history.push(action);

    // Keep only last 1000 actions
    const trimmed = history.slice(-1000);
    
    localStorage.setItem('ss.action_history', JSON.stringify(trimmed));
  } catch (error) {
    console.error('[recordAction] Error:', error);
  }
}

/**
 * Get recent completions (last 2 hours)
 */
function getRecentCompletions() {
  try {
    const stored = localStorage.getItem('ss.recent_completions');
    if (!stored) return [];
    
    const completions = JSON.parse(stored);
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    
    return completions.filter(c => c.timestamp > twoHoursAgo);
  } catch (error) {
    return [];
  }
}

/**
 * Get current energy level category
 */
function getCurrentEnergyLevel() {
  try {
    const energyHistory = JSON.parse(localStorage.getItem('ss.energy_history') || '[]');
    if (energyHistory.length === 0) return 'moderate';
    
    const latest = energyHistory[energyHistory.length - 1];
    const score = latest.score;
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  } catch (error) {
    return 'moderate';
  }
}

/**
 * Get time of day category
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Get recent team activity
 */
async function getRecentTeamActivity() {
  try {
    const token = localStorage.getItem('ss.jwt');
    if (!token) return [];

    const response = await fetch('http://localhost:3000/api/activity/team/recent', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.activities || [];
  } catch (error) {
    return [];
  }
}

/**
 * Format hour for display
 */
function formatHour(hour) {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

/**
 * Get icon for action type
 */
function getIconForActionType(actionType) {
  const icons = {
    'reports': '📊',
    'code': '💻',
    'design': '🎨',
    'review': '👀',
    'bugs': '🐛',
    'meeting': '🤝',
    'planning': '📝',
    'shipping': '🚢',
  };
  return icons[actionType] || '📋';
}