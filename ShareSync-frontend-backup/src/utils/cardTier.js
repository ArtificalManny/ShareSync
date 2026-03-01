// src/utils/cardTier.js
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 2: Card Tier Helper
// Maps card purpose → CSS class name
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Card tier CSS classes
 */
export const CARD_TIERS = {
  surface: 'card-surface',
  action: 'card-action',
  hero: 'card-hero',
};

/**
 * Get the card tier CSS class for a given context.
 *
 * @param {'surface'|'action'|'hero'} tier - Card tier
 * @param {object} [options]
 * @param {boolean} [options.urgent] - Adds pulse animation to hero cards
 * @param {boolean} [options.fireMode] - Whether fire mode is active
 * @returns {string} CSS class string
 */
export function getCardTier(tier = 'surface', options = {}) {
  const { urgent = false, fireMode = false } = options;

  const base = CARD_TIERS[tier] || CARD_TIERS.surface;
  const parts = [base];

  if (tier === 'hero' && urgent) {
    parts.push('card-hero--urgent');
  }

  if (fireMode) {
    parts.push('fire-mode');
  }

  return parts.join(' ');
}

/**
 * Determine card tier from a project/task context.
 * Useful for automatic tier assignment based on data.
 *
 * @param {object} item - Project, task, or card data
 * @returns {'surface'|'action'|'hero'}
 */
export function inferCardTier(item) {
  if (!item) return 'surface';

  // Hero: critical/overdue tasks, celebrations, streak warnings
  if (item.isUrgent || item.isOverdue || item.isCritical || item.isCelebration) {
    return 'hero';
  }

  // Action: tasks, projects, interactive cards
  if (item.isInteractive || item.onClick || item.isTask || item.isProject) {
    return 'action';
  }

  // Surface: informational/passive
  return 'surface';
}

export default getCardTier;
