// src/gamification/services/xp-calculator.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// XP CALCULATOR SERVICE: The heart of the reward system
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import {
  BASE_XP,
  VARIABLE_REWARDS,
  XP_MULTIPLIERS,
  getCeremonyTier,
  getStreakMultiplier,
} from '../constants/xp.constants';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskCompletionContext {
  priority: 'low' | 'medium' | 'high' | 'critical';
  isBlocking?: boolean;
  isOnTime?: boolean;
  isEarly?: boolean;
  isOverdue?: boolean;
  inFocusMode?: boolean;
  currentStreak?: number;
  isFirstTaskOfDay?: boolean;
  unblockedCount?: number;
}

export interface XPCalculationResult {
  baseXP: number;
  bonusXP: number;
  multiplier: number;
  totalXP: number;
  isLegendary: boolean;
  hasBonus: boolean;
  hasMultiplier: boolean;
  breakdown: {
    base: number;
    blocking?: number;
    timing?: number;
    streak?: number;
    focus?: number;
    firstTask?: number;
    bonus?: number;
    legendary?: number;
  };
  ceremony: {
    tier: string;
    name: string;
    animation: string;
    sound: string;
    duration: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class XPCalculatorService {
  private readonly logger = new Logger(XPCalculatorService.name);

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN CALCULATION METHOD
  // ─────────────────────────────────────────────────────────────────────────────

  calculateTaskXP(context: TaskCompletionContext): XPCalculationResult {
    const breakdown: XPCalculationResult['breakdown'] = { base: 0 };
    
    // 1. Calculate base XP from priority
    const baseXP = this.getBaseXP(context.priority);
    breakdown.base = baseXP;
    let totalXP = baseXP;
    
    // 2. Add blocking bonus
    if (context.isBlocking && context.unblockedCount && context.unblockedCount > 0) {
      const blockingBonus = Math.round(baseXP * (XP_MULTIPLIERS.BLOCKING_TASK - 1));
      breakdown.blocking = blockingBonus;
      totalXP += blockingBonus;
    }
    
    // 3. Apply timing multiplier
    let timingMultiplier = 1;
    if (context.isEarly) {
      timingMultiplier = XP_MULTIPLIERS.EARLY_COMPLETION;
    } else if (context.isOnTime) {
      timingMultiplier = XP_MULTIPLIERS.ON_TIME_COMPLETION;
    } else if (context.isOverdue) {
      timingMultiplier = XP_MULTIPLIERS.OVERDUE_PENALTY;
    }
    
    if (timingMultiplier !== 1) {
      const timingBonus = Math.round(totalXP * (timingMultiplier - 1));
      breakdown.timing = timingBonus;
      totalXP += timingBonus;
    }
    
    // 4. Apply streak multiplier
    if (context.currentStreak && context.currentStreak > 2) {
      const streakMult = getStreakMultiplier(context.currentStreak);
      if (streakMult > 1) {
        const streakBonus = Math.round(totalXP * (streakMult - 1));
        breakdown.streak = streakBonus;
        totalXP += streakBonus;
      }
    }
    
    // 5. Focus mode bonus
    if (context.inFocusMode) {
      const focusBonus = Math.round(totalXP * (XP_MULTIPLIERS.FOCUS_MODE - 1));
      breakdown.focus = focusBonus;
      totalXP += focusBonus;
    }
    
    // 6. First task of day bonus
    if (context.isFirstTaskOfDay) {
      const firstTaskBonus = Math.round(totalXP * (XP_MULTIPLIERS.FIRST_TASK_OF_DAY - 1));
      breakdown.firstTask = firstTaskBonus;
      totalXP += firstTaskBonus;
    }
    
    // 7. Roll for variable rewards!
    const variableResult = this.rollVariableRewards(totalXP);
    
    let bonusXP = 0;
    let multiplier = 1;
    let isLegendary = false;
    
    if (variableResult.isLegendary) {
      bonusXP = BASE_XP.LEGENDARY_SHIP;
      breakdown.legendary = bonusXP;
      isLegendary = true;
      this.logger.log('🌟 LEGENDARY REWARD HIT!');
    } else if (variableResult.bonus > 0) {
      bonusXP = variableResult.bonus;
      breakdown.bonus = bonusXP;
    }
    
    if (variableResult.multiplier > 1) {
      multiplier = variableResult.multiplier;
    }
    
    // Apply multiplier to total (including bonus)
    const finalXP = Math.round((totalXP + bonusXP) * multiplier);
    
    // Determine ceremony tier
    const ceremonyTier = getCeremonyTier(finalXP, isLegendary);
    
    return {
      baseXP,
      bonusXP,
      multiplier,
      totalXP: finalXP,
      isLegendary,
      hasBonus: bonusXP > 0,
      hasMultiplier: multiplier > 1,
      breakdown,
      ceremony: {
        tier: ceremonyTier.name,
        name: ceremonyTier.name,
        animation: ceremonyTier.animation,
        sound: ceremonyTier.sound,
        duration: ceremonyTier.duration,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BASE XP CALCULATION
  // ─────────────────────────────────────────────────────────────────────────────

  getBaseXP(priority: string): number {
    switch (priority) {
      case 'critical':
        return BASE_XP.TASK_CRITICAL;
      case 'high':
        return BASE_XP.TASK_HIGH;
      case 'medium':
        return BASE_XP.TASK_MEDIUM;
      case 'low':
      default:
        return BASE_XP.TASK_LOW;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VARIABLE REWARDS (The Dopamine System)
  // ─────────────────────────────────────────────────────────────────────────────

  rollVariableRewards(baseTotal: number): {
    isLegendary: boolean;
    bonus: number;
    multiplier: number;
  } {
    const result = {
      isLegendary: false,
      bonus: 0,
      multiplier: 1,
    };
    
    // Roll for legendary (1% chance)
    if (Math.random() < VARIABLE_REWARDS.LEGENDARY_CHANCE) {
      result.isLegendary = true;
      return result; // Legendary overrides other bonuses
    }
    
    // Roll for bonus XP (15% chance)
    if (Math.random() < VARIABLE_REWARDS.BONUS_CHANCE) {
      const bonusMultiplier = 
        VARIABLE_REWARDS.BONUS_MIN_MULTIPLIER +
        Math.random() * (VARIABLE_REWARDS.BONUS_MAX_MULTIPLIER - VARIABLE_REWARDS.BONUS_MIN_MULTIPLIER);
      result.bonus = Math.round(baseTotal * bonusMultiplier);
    }
    
    // Roll for multiplier (8% chance)
    if (Math.random() < VARIABLE_REWARDS.MULTIPLIER_CHANCE) {
      result.multiplier = 
        VARIABLE_REWARDS.MULTIPLIER_MIN +
        Math.random() * (VARIABLE_REWARDS.MULTIPLIER_MAX - VARIABLE_REWARDS.MULTIPLIER_MIN);
      result.multiplier = Math.round(result.multiplier * 10) / 10; // Round to 1 decimal
    }
    
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIAL CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  calculateSprintGoalXP(): number {
    return BASE_XP.SPRINT_GOAL;
  }

  calculateProjectShipXP(): number {
    return BASE_XP.PROJECT_SHIP;
  }

  calculateMilestoneXP(): number {
    return BASE_XP.MILESTONE;
  }

  calculateSubtaskXP(): number {
    return BASE_XP.SUBTASK;
  }

  calculateBugFixXP(): number {
    return BASE_XP.BUG_FIX;
  }
}
