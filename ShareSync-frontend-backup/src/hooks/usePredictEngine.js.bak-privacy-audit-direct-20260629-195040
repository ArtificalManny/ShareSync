// src/hooks/usePredictEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: AI-Powered Foresight
// The app tells you what's going to happen before it happens
// ═══════════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// RISK LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const RISK_TYPES = {
  BLOCKED_TASK: 'blocked_task',
  OVERLOADED_MEMBER: 'overloaded_member',
  STALE_WORK: 'stale_work',
  DEADLINE_RISK: 'deadline_risk',
  SCOPE_CREEP: 'scope_creep',
  DEPENDENCY_CHAIN: 'dependency_chain',
  ESTIMATION_DRIFT: 'estimation_drift',
};

// ═══════════════════════════════════════════════════════════════════════════════
// VELOCITY CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate team/individual velocity (tasks completed per day)
 */
function calculateVelocity(completedTasks, days) {
  if (days <= 0) return 0;
  return completedTasks.length / days;
}

/**
 * Calculate weighted velocity (recent work weighted more heavily)
 */
function calculateWeightedVelocity(completedTasks, lookbackDays = 14) {
  const now = new Date();
  let weightedSum = 0;
  let weightTotal = 0;
  
  completedTasks.forEach(task => {
    const completedDate = new Date(task.completedAt);
    const daysAgo = (now - completedDate) / (1000 * 60 * 60 * 24);
    
    if (daysAgo <= lookbackDays) {
      // More recent = higher weight (exponential decay)
      const weight = Math.exp(-daysAgo / 7);
      weightedSum += weight;
      weightTotal += weight;
    }
  });
  
  return weightTotal > 0 ? (weightedSum / weightTotal) * (completedTasks.length / lookbackDays) : 0;
}

/**
 * Calculate average task duration
 */
function calculateAverageTaskDuration(completedTasks) {
  if (completedTasks.length === 0) return 0;
  
  const tasksWithDuration = completedTasks.filter(t => t.startedAt && t.completedAt);
  if (tasksWithDuration.length === 0) return 2; // Default 2 hours
  
  const totalHours = tasksWithDuration.reduce((sum, task) => {
    const start = new Date(task.startedAt);
    const end = new Date(task.completedAt);
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);
  
  return totalHours / tasksWithDuration.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETION FORECASTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Forecast sprint/project completion
 */
function forecastCompletion({
  totalTasks,
  completedTasks,
  remainingTasks,
  deadline,
  velocity,
  startDate,
}) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysRemaining = Math.max(0, (deadlineDate - now) / (1000 * 60 * 60 * 24));
  const totalDays = (deadlineDate - new Date(startDate)) / (1000 * 60 * 60 * 24);
  const daysElapsed = totalDays - daysRemaining;
  
  // Current completion percentage
  const currentCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // At current pace
  const tasksPerDay = velocity;
  const projectedCompletion = Math.min(100, 
    ((completedTasks + (tasksPerDay * daysRemaining)) / totalTasks) * 100
  );
  
  // With 10% more effort
  const boostedCompletion = Math.min(100,
    ((completedTasks + (tasksPerDay * 1.1 * daysRemaining)) / totalTasks) * 100
  );
  
  // Required pace to finish 100%
  const requiredVelocity = daysRemaining > 0 ? remainingTasks / daysRemaining : Infinity;
  
  // Projected completion date at current pace
  const daysToComplete = velocity > 0 ? remainingTasks / velocity : Infinity;
  const projectedCompletionDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
  
  // Days ahead/behind schedule
  const expectedCompletion = (daysElapsed / totalDays) * 100;
  const daysAhead = velocity > 0 
    ? (currentCompletion - expectedCompletion) / (velocity / totalTasks * 100)
    : 0;
  
  return {
    currentCompletion: Math.round(currentCompletion),
    projectedCompletion: Math.round(projectedCompletion),
    boostedCompletion: Math.round(boostedCompletion),
    requiredVelocity: Math.round(requiredVelocity * 10) / 10,
    currentVelocity: Math.round(velocity * 10) / 10,
    daysRemaining: Math.round(daysRemaining),
    projectedCompletionDate,
    daysAhead: Math.round(daysAhead),
    isOnTrack: projectedCompletion >= 95,
    isAtRisk: projectedCompletion < 80,
    velocityGap: requiredVelocity - velocity,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect project risks
 */
function detectRisks({
  tasks,
  teamMembers,
  sprint,
  averageWorkload,
}) {
  const risks = [];
  const now = new Date();
  
  // 1. Blocked tasks
  tasks.filter(t => t.status === 'blocked').forEach(task => {
    const blockedDays = task.blockedSince 
      ? Math.floor((now - new Date(task.blockedSince)) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (blockedDays >= 2) {
      risks.push({
        type: RISK_TYPES.BLOCKED_TASK,
        level: blockedDays >= 5 ? RISK_LEVELS.CRITICAL : blockedDays >= 3 ? RISK_LEVELS.HIGH : RISK_LEVELS.MEDIUM,
        title: `Task blocked for ${blockedDays} days`,
        description: `"${task.title}" has been blocked since ${new Date(task.blockedSince).toLocaleDateString()}`,
        task,
        metric: blockedDays,
        suggestion: 'Escalate or reassign to unblock',
      });
    }
  });
  
  // 2. Overloaded team members
  teamMembers.forEach(member => {
    const memberTasks = tasks.filter(t => 
      t.assigneeId === member.id && 
      t.status !== 'completed'
    );
    const workload = memberTasks.length;
    const workloadPercentage = averageWorkload > 0 ? (workload / averageWorkload) * 100 : 0;
    
    if (workloadPercentage >= 130) {
      risks.push({
        type: RISK_TYPES.OVERLOADED_MEMBER,
        level: workloadPercentage >= 180 ? RISK_LEVELS.CRITICAL : workloadPercentage >= 150 ? RISK_LEVELS.HIGH : RISK_LEVELS.MEDIUM,
        title: `${member.name} is overloaded`,
        description: `Workload is ${Math.round(workloadPercentage)}% of team average (${workload} tasks)`,
        member,
        metric: workloadPercentage,
        suggestion: 'Redistribute tasks or adjust priorities',
      });
    }
  });
  
  // 3. Stale work (no progress)
  tasks.filter(t => t.status === 'in_progress').forEach(task => {
    const lastUpdate = task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt);
    const staleDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    
    if (staleDays >= 3) {
      risks.push({
        type: RISK_TYPES.STALE_WORK,
        level: staleDays >= 7 ? RISK_LEVELS.HIGH : RISK_LEVELS.MEDIUM,
        title: `No progress on task for ${staleDays} days`,
        description: `"${task.title}" hasn't been updated since ${lastUpdate.toLocaleDateString()}`,
        task,
        metric: staleDays,
        suggestion: 'Check in with assignee or reassess priority',
      });
    }
  });
  
  // 4. Deadline risk
  if (sprint?.deadline) {
    const daysToDeadline = Math.floor((new Date(sprint.deadline) - now) / (1000 * 60 * 60 * 24));
    const remainingTasks = tasks.filter(t => t.status !== 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    if (daysToDeadline <= 3 && completionRate < 80) {
      risks.push({
        type: RISK_TYPES.DEADLINE_RISK,
        level: daysToDeadline <= 1 ? RISK_LEVELS.CRITICAL : RISK_LEVELS.HIGH,
        title: `Sprint deadline at risk`,
        description: `${daysToDeadline} days remaining with ${remainingTasks} tasks incomplete (${Math.round(completionRate)}% done)`,
        sprint,
        metric: completionRate,
        suggestion: 'Consider scope reduction or deadline extension',
      });
    }
  }
  
  // 5. Dependency chains (tasks blocking multiple others)
  tasks.forEach(task => {
    if (task.blockedTasks && task.blockedTasks.length >= 3) {
      risks.push({
        type: RISK_TYPES.DEPENDENCY_CHAIN,
        level: task.blockedTasks.length >= 5 ? RISK_LEVELS.HIGH : RISK_LEVELS.MEDIUM,
        title: `Task blocking ${task.blockedTasks.length} others`,
        description: `"${task.title}" is a bottleneck`,
        task,
        metric: task.blockedTasks.length,
        suggestion: 'Prioritize completion or parallelize work',
      });
    }
  });
  
  // Sort by level severity
  const levelOrder = { [RISK_LEVELS.CRITICAL]: 0, [RISK_LEVELS.HIGH]: 1, [RISK_LEVELS.MEDIUM]: 2, [RISK_LEVELS.LOW]: 3 };
  return risks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate smart suggestions for a task
 */
function generateSuggestions({
  task,
  allTasks,
  teamMembers,
  historicalTasks,
}) {
  const suggestions = [];
  
  // 1. Similar task finder
  const similarTasks = findSimilarTasks(task, historicalTasks);
  if (similarTasks.length > 0) {
    const bestMatch = similarTasks[0];
    suggestions.push({
      type: 'similar_task',
      icon: '💡',
      title: 'Similar task found',
      description: `"${bestMatch.task.title}" was completed by ${bestMatch.completedBy}. Ask for advice?`,
      action: { type: 'contact', userId: bestMatch.completedById },
      confidence: bestMatch.similarity,
    });
  }
  
  // 2. Estimation check
  if (task.estimatedHours) {
    const similarTaskAvgDuration = calculateSimilarTaskDuration(task, historicalTasks);
    if (similarTaskAvgDuration && Math.abs(task.estimatedHours - similarTaskAvgDuration) / similarTaskAvgDuration > 0.5) {
      suggestions.push({
        type: 'estimation_warning',
        icon: '⏱️',
        title: 'Estimation may be off',
        description: `This type of task usually takes ${formatDuration(similarTaskAvgDuration)}. You estimated ${formatDuration(task.estimatedHours)}.`,
        action: { type: 'adjust_estimate', suggested: similarTaskAvgDuration },
        confidence: 0.7,
      });
    }
  }
  
  // 3. Task splitting suggestion
  if (task.estimatedHours && task.estimatedHours > 8) {
    suggestions.push({
      type: 'split_task',
      icon: '✂️',
      title: 'Consider breaking this down',
      description: `Large tasks (${formatDuration(task.estimatedHours)}) are harder to estimate. Split into ${Math.ceil(task.estimatedHours / 4)} smaller tasks?`,
      action: { type: 'split', suggestedCount: Math.ceil(task.estimatedHours / 4) },
      confidence: 0.8,
    });
  }
  
  // 4. Best assignee suggestion
  if (!task.assigneeId && teamMembers.length > 0) {
    const bestAssignee = findBestAssignee(task, teamMembers, historicalTasks);
    if (bestAssignee) {
      suggestions.push({
        type: 'assignee_suggestion',
        icon: '👤',
        title: 'Suggested assignee',
        description: `${bestAssignee.name} has completed ${bestAssignee.similarTaskCount} similar tasks with ${Math.round(bestAssignee.successRate * 100)}% success rate.`,
        action: { type: 'assign', userId: bestAssignee.id },
        confidence: bestAssignee.confidence,
      });
    }
  }
  
  // 5. Priority adjustment
  if (task.blockedTasks && task.blockedTasks.length >= 2 && task.priority !== 'critical') {
    suggestions.push({
      type: 'priority_boost',
      icon: '🔥',
      title: 'Consider raising priority',
      description: `This task is blocking ${task.blockedTasks.length} others. Prioritizing could unblock the team.`,
      action: { type: 'set_priority', priority: 'critical' },
      confidence: 0.85,
    });
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

function findSimilarTasks(task, historicalTasks) {
  if (!task.title || historicalTasks.length === 0) return [];
  
  const taskWords = task.title.toLowerCase().split(/\s+/);
  const taskTags = task.tags || [];
  
  return historicalTasks
    .filter(h => h.status === 'completed' && h.id !== task.id)
    .map(historicalTask => {
      const histWords = historicalTask.title.toLowerCase().split(/\s+/);
      const histTags = historicalTask.tags || [];
      
      // Word overlap
      const wordOverlap = taskWords.filter(w => histWords.includes(w)).length;
      const wordSimilarity = wordOverlap / Math.max(taskWords.length, histWords.length);
      
      // Tag overlap
      const tagOverlap = taskTags.filter(t => histTags.includes(t)).length;
      const tagSimilarity = (taskTags.length + histTags.length) > 0 
        ? tagOverlap / Math.max(taskTags.length, histTags.length)
        : 0;
      
      const similarity = (wordSimilarity * 0.6) + (tagSimilarity * 0.4);
      
      return {
        task: historicalTask,
        similarity,
        completedBy: historicalTask.completedByName,
        completedById: historicalTask.completedById,
      };
    })
    .filter(r => r.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

function calculateSimilarTaskDuration(task, historicalTasks) {
  const similar = findSimilarTasks(task, historicalTasks);
  if (similar.length === 0) return null;
  
  const durations = similar
    .map(s => s.task.actualHours || s.task.estimatedHours)
    .filter(Boolean);
  
  if (durations.length === 0) return null;
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

function findBestAssignee(task, teamMembers, historicalTasks) {
  const taskTags = task.tags || [];
  
  const candidates = teamMembers.map(member => {
    const memberTasks = historicalTasks.filter(t => t.completedById === member.id);
    const similarTasks = memberTasks.filter(t => {
      const histTags = t.tags || [];
      return taskTags.some(tag => histTags.includes(tag));
    });
    
    const successRate = memberTasks.length > 0
      ? memberTasks.filter(t => t.status === 'completed').length / memberTasks.length
      : 0.5;
    
    return {
      ...member,
      similarTaskCount: similarTasks.length,
      totalTasks: memberTasks.length,
      successRate,
      confidence: (similarTasks.length / Math.max(memberTasks.length, 1)) * successRate,
    };
  });
  
  return candidates.sort((a, b) => b.confidence - a.confidence)[0];
}

function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours === 1) return '1 hour';
  return `${Math.round(hours)} hours`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPACITY PLANNING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate team capacity forecast
 */
function calculateCapacity({
  teamMembers,
  tasks,
  daysAhead = 7,
  hoursPerDay = 6,
}) {
  return teamMembers.map(member => {
    const memberTasks = tasks.filter(t => 
      t.assigneeId === member.id && 
      t.status !== 'completed'
    );
    
    const totalHours = memberTasks.reduce((sum, t) => 
      sum + (t.estimatedHours || 2), 0
    );
    
    const capacity = daysAhead * hoursPerDay;
    const utilization = capacity > 0 ? (totalHours / capacity) * 100 : 0;
    
    return {
      member,
      assignedTasks: memberTasks.length,
      totalHours,
      capacity,
      utilization: Math.round(utilization),
      status: utilization > 120 ? 'overloaded' 
        : utilization > 90 ? 'full'
        : utilization > 60 ? 'healthy'
        : 'available',
      availableHours: Math.max(0, capacity - totalHours),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHAT-IF SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simulate scenarios
 */
function simulateScenario({
  scenario,
  tasks,
  teamMembers,
  sprint,
  currentForecast,
}) {
  const { type, params } = scenario;
  let newTasks = [...tasks];
  let newTeam = [...teamMembers];
  let newSprint = { ...sprint };
  
  switch (type) {
    case 'cut_feature':
      // Remove tasks with matching tag/feature
      newTasks = tasks.filter(t => 
        !(t.tags || []).includes(params.featureTag) &&
        t.featureId !== params.featureId
      );
      break;
      
    case 'add_member':
      // Add team member with estimated capacity
      newTeam = [...teamMembers, params.newMember];
      break;
      
    case 'remove_member':
      // Remove team member, reassign tasks to pool
      newTeam = teamMembers.filter(m => m.id !== params.memberId);
      newTasks = tasks.map(t => 
        t.assigneeId === params.memberId 
          ? { ...t, assigneeId: null }
          : t
      );
      break;
      
    case 'extend_deadline':
      // Move deadline
      newSprint = { 
        ...sprint, 
        deadline: new Date(new Date(sprint.deadline).getTime() + params.days * 24 * 60 * 60 * 1000).toISOString()
      };
      break;
      
    case 'add_scope':
      // Add new tasks
      newTasks = [...tasks, ...params.newTasks];
      break;
      
    case 'reduce_scope':
      // Remove low-priority tasks
      newTasks = tasks.filter(t => 
        t.priority === 'critical' || t.priority === 'high'
      );
      break;
  }
  
  // Recalculate forecast with new parameters
  const completedTasks = newTasks.filter(t => t.status === 'completed').length;
  const remainingTasks = newTasks.filter(t => t.status !== 'completed').length;
  
  const newForecast = forecastCompletion({
    totalTasks: newTasks.length,
    completedTasks,
    remainingTasks,
    deadline: newSprint.deadline,
    velocity: currentForecast.currentVelocity,
    startDate: newSprint.startDate,
  });
  
  const newCapacity = calculateCapacity({
    teamMembers: newTeam,
    tasks: newTasks,
  });
  
  return {
    scenario,
    originalForecast: currentForecast,
    newForecast,
    newCapacity,
    impact: {
      completionChange: newForecast.projectedCompletion - currentForecast.projectedCompletion,
      tasksChanged: newTasks.length - tasks.length,
      teamSizeChange: newTeam.length - teamMembers.length,
      deadlineChange: params.days || 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * usePredictEngine - AI-powered project foresight
 */
export function usePredictEngine({
  tasks = [],
  teamMembers = [],
  sprint = null,
  historicalTasks = [],
} = {}) {
  
  // Calculate base metrics
  const completedTasks = useMemo(() => 
    tasks.filter(t => t.status === 'completed'),
    [tasks]
  );
  
  const remainingTasks = useMemo(() => 
    tasks.filter(t => t.status !== 'completed'),
    [tasks]
  );
  
  // Calculate velocity
  const velocity = useMemo(() => {
    if (!sprint?.startDate) return 0;
    const days = Math.max(1, (Date.now() - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24));
    return calculateVelocity(completedTasks, days);
  }, [completedTasks, sprint?.startDate]);
  
  const weightedVelocity = useMemo(() => 
    calculateWeightedVelocity(completedTasks),
    [completedTasks]
  );
  
  // Completion forecast
  const forecast = useMemo(() => {
    if (!sprint?.deadline) return null;
    return forecastCompletion({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      remainingTasks: remainingTasks.length,
      deadline: sprint.deadline,
      velocity: weightedVelocity || velocity,
      startDate: sprint.startDate,
    });
  }, [tasks.length, completedTasks.length, remainingTasks.length, sprint, velocity, weightedVelocity]);
  
  // Risk detection
  const risks = useMemo(() => {
    const avgWorkload = teamMembers.length > 0
      ? tasks.filter(t => t.status !== 'completed').length / teamMembers.length
      : 0;
    
    return detectRisks({
      tasks,
      teamMembers,
      sprint,
      averageWorkload: avgWorkload,
    });
  }, [tasks, teamMembers, sprint]);
  
  // Capacity planning
  const capacity = useMemo(() => 
    calculateCapacity({ teamMembers, tasks }),
    [teamMembers, tasks]
  );
  
  // Get suggestions for a task
  const getSuggestions = useCallback((task) => {
    return generateSuggestions({
      task,
      allTasks: tasks,
      teamMembers,
      historicalTasks,
    });
  }, [tasks, teamMembers, historicalTasks]);
  
  // Run what-if simulation
  const simulate = useCallback((scenario) => {
    if (!forecast) return null;
    return simulateScenario({
      scenario,
      tasks,
      teamMembers,
      sprint,
      currentForecast: forecast,
    });
  }, [tasks, teamMembers, sprint, forecast]);
  
  return {
    // Metrics
    velocity,
    weightedVelocity,
    completedCount: completedTasks.length,
    remainingCount: remainingTasks.length,
    
    // Predictions
    forecast,
    risks,
    capacity,
    
    // Actions
    getSuggestions,
    simulate,
    
    // Risk counts
    criticalRisks: risks.filter(r => r.level === RISK_LEVELS.CRITICAL).length,
    highRisks: risks.filter(r => r.level === RISK_LEVELS.HIGH).length,
    
    // Constants
    RISK_LEVELS,
    RISK_TYPES,
  };
}

export default usePredictEngine;
