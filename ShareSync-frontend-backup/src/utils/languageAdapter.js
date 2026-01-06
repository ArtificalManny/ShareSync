// src/utils/languageAdapter.js
import { getUserSegment } from '../config/demographics';

/**
 * Language Adapter - Translates actions into age-appropriate language
 * 
 * Same UI, different voice based on user demographic
 */

/**
 * Action-to-Language Mappings
 * Each action has translations for all demographics
 */
const LANGUAGE_MAPS = {
  // STARTING WORK
  'start-day': {
    'middle-school': 'Start your homework',
    'high-school': 'Begin your study session',
    'college': 'Kick off your projects',
    'corporate': 'Start your workday',
    'freelance': 'Begin client work',
    'creator': 'Start creating',
    'default': 'Start your day',
  },
  
  'plan-day': {
    'middle-school': 'Plan your homework',
    'high-school': 'Plan your studies',
    'college': 'Plan your tasks',
    'corporate': 'Plan your day',
    'freelance': 'Plan your schedule',
    'creator': 'Plan your content',
    'default': 'Plan your day',
  },
  
  // COMPLETING WORK
  'complete-sprint': {
    'middle-school': 'Finish homework sprint',
    'high-school': 'Complete study session',
    'college': 'Wrap up milestone',
    'corporate': 'Close Q4 objectives',
    'freelance': 'Deliver client work',
    'creator': 'Ship your content',
    'default': 'Complete tasks',
  },
  
  'ship-task': {
    'middle-school': 'Turn in assignment',
    'high-school': 'Submit your work',
    'college': 'Submit project',
    'corporate': 'Ship feature',
    'freelance': 'Deliver to client',
    'creator': 'Publish content',
    'default': 'Ship task',
  },
  
  // REVIEWING
  'review': {
    'middle-school': 'Check your homework',
    'high-school': 'Review your notes',
    'college': 'Review progress',
    'corporate': 'Review metrics',
    'freelance': 'Review deliverables',
    'creator': 'Review analytics',
    'default': 'Review tasks',
  },
  
  // PLANNING AHEAD
  'plan-tomorrow': {
    'middle-school': 'Plan tomorrow\'s homework',
    'high-school': 'Plan tomorrow\'s classes',
    'college': 'Plan tomorrow\'s work',
    'corporate': 'Plan tomorrow',
    'freelance': 'Schedule tomorrow',
    'creator': 'Plan next content',
    'default': 'Plan tomorrow',
  },
  
  'plan-week': {
    'middle-school': 'Plan your week\'s homework',
    'high-school': 'Plan your study week',
    'college': 'Plan your week',
    'corporate': 'Plan weekly goals',
    'freelance': 'Plan client schedule',
    'creator': 'Plan content calendar',
    'default': 'Plan your week',
  },
  
  // EXPLORING
  'explore': {
    'middle-school': 'Research your topic',
    'high-school': 'Explore ideas',
    'college': 'Research project',
    'corporate': 'Explore opportunities',
    'freelance': 'Explore new clients',
    'creator': 'Brainstorm content',
    'default': 'Explore ideas',
  },
  
  // WRAPPING UP
  'wrap-up': {
    'middle-school': 'Finish up homework',
    'high-school': 'Wrap up studies',
    'college': 'Wrap up the week',
    'corporate': 'Close the week',
    'freelance': 'Complete deliverables',
    'creator': 'Ship final content',
    'default': 'Wrap up',
  },
  
  // TAKING BREAKS
  'rest': {
    'middle-school': 'Take a break',
    'high-school': 'Rest a bit',
    'college': 'Take a breather',
    'corporate': 'Step away',
    'freelance': 'Recharge',
    'creator': 'Rest your creativity',
    'default': 'Time to rest',
  },
  
  // ENERGY-SPECIFIC
  'low-energy-task': {
    'middle-school': 'Easy homework only',
    'high-school': 'Light study tasks',
    'college': 'Simple tasks only',
    'corporate': 'Admin work only',
    'freelance': 'Light client emails',
    'creator': 'Simple edits only',
    'default': 'Light tasks',
  },
  
  'high-energy-task': {
    'middle-school': 'Tackle hard homework',
    'high-school': 'Ace that tough subject',
    'college': 'Crush big project',
    'corporate': 'Execute critical work',
    'freelance': 'Deliver key project',
    'creator': 'Create your best work',
    'default': 'Tackle hard tasks',
  },
};

/**
 * Adapt text based on user's demographic segment
 * 
 * @param {string} actionKey - Action identifier (e.g., 'start-day')
 * @param {string} fallback - Fallback text if no mapping exists
 * @returns {string} Age-appropriate language
 */
export function adaptLanguage(actionKey, fallback = '') {
  const segment = getUserSegment();
  
  // Get mapping for this action
  const mapping = LANGUAGE_MAPS[actionKey];
  
  if (!mapping) {
    // No mapping exists, return fallback
    return fallback;
  }
  
  // Return segment-specific text, or default, or fallback
  return mapping[segment] || mapping['default'] || fallback;
}

/**
 * Adapt message based on user's demographic segment
 * 
 * @param {string} messageKey - Message identifier
 * @param {string} fallback - Fallback message
 * @returns {string} Age-appropriate message
 */
export function adaptMessage(messageKey, fallback = '') {
  const MESSAGE_MAPS = {
    'take-it-slow': {
      'middle-school': 'No rush, you got this!',
      'high-school': 'Take your time',
      'college': 'Pace yourself',
      'corporate': 'Work at your own pace',
      'freelance': 'Don\'t overdo it',
      'creator': 'Creativity needs time',
      'default': 'Take it slow',
    },
    
    'you-got-this': {
      'middle-school': 'You can do it!',
      'high-school': 'You got this!',
      'college': 'Let\'s go!',
      'corporate': 'Execute with confidence',
      'freelance': 'Deliver excellence',
      'creator': 'Create something amazing',
      'default': 'You got this',
    },
    
    'in-the-zone': {
      'middle-school': 'You\'re on fire!',
      'high-school': 'You\'re crushing it!',
      'college': 'You\'re in the zone!',
      'corporate': 'Peak performance mode',
      'freelance': 'Momentum is yours',
      'creator': 'Creative flow activated',
      'default': 'You\'re in the zone',
    },
  };
  
  const segment = getUserSegment();
  const mapping = MESSAGE_MAPS[messageKey];
  
  if (!mapping) return fallback;
  
  return mapping[segment] || mapping['default'] || fallback;
}

/**
 * Get demographic-specific icon/emoji
 */
export function getSegmentIcon() {
  const segment = getUserSegment();
  const icons = {
    'middle-school': '📚',
    'high-school': '🎓',
    'college': '🎯',
    'corporate': '💼',
    'freelance': '💻',
    'creator': '🎨',
    'default': '⭐',
  };
  
  return icons[segment] || icons['default'];
}