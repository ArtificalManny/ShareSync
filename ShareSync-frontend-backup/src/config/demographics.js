// src/config/demographics.js
/**
 * User Demographic Segments
 * 
 * ShareSync adapts its language based on user age/context
 * Same functionality, different voice
 */

export const USER_SEGMENTS = {
  'middle-school': {
    id: 'middle-school',
    name: 'Middle School',
    ageRange: '11-14',
    context: 'homework',
    tone: 'encouraging',
    icon: '📚',
  },
  'high-school': {
    id: 'high-school',
    name: 'High School',
    ageRange: '14-18',
    context: 'academics',
    tone: 'motivational',
    icon: '🎓',
  },
  'college': {
    id: 'college',
    name: 'College',
    ageRange: '18-25',
    context: 'projects',
    tone: 'professional-casual',
    icon: '🎯',
  },
  'corporate': {
    id: 'corporate',
    name: 'Corporate',
    ageRange: '25-65',
    context: 'business',
    tone: 'professional',
    icon: '💼',
  },
  'freelance': {
    id: 'freelance',
    name: 'Freelancer',
    ageRange: '20-65',
    context: 'clients',
    tone: 'entrepreneurial',
    icon: '💻',
  },
  'creator': {
    id: 'creator',
    name: 'Content Creator',
    ageRange: '16-45',
    context: 'content',
    tone: 'creative',
    icon: '🎨',
  },
  'default': {
    id: 'default',
    name: 'General',
    ageRange: 'all',
    context: 'work',
    tone: 'neutral',
    icon: '⭐',
  },
};

/**
 * Detect user segment from profile or default to general
 */
export function getUserSegment() {
  try {
    const user = JSON.parse(localStorage.getItem('ss.user') || '{}');
    
    // Check if user has explicitly set their segment
    if (user.demographic && USER_SEGMENTS[user.demographic]) {
      return user.demographic;
    }
    
    // Auto-detect from age if available
    if (user.age) {
      const age = parseInt(user.age);
      if (age >= 11 && age < 14) return 'middle-school';
      if (age >= 14 && age < 18) return 'high-school';
      if (age >= 18 && age < 25) return 'college';
      if (age >= 25) return 'corporate';
    }
    
    // Auto-detect from role/occupation
    if (user.role) {
      const role = user.role.toLowerCase();
      if (role.includes('student')) {
        if (role.includes('college') || role.includes('university')) return 'college';
        if (role.includes('high')) return 'high-school';
        return 'middle-school';
      }
      if (role.includes('freelance')) return 'freelance';
      if (role.includes('creator') || role.includes('artist')) return 'creator';
      if (role.includes('manager') || role.includes('director')) return 'corporate';
    }
    
    // Default to corporate (most common)
    return 'corporate';
  } catch (error) {
    console.error('[getUserSegment] Error:', error);
    return 'default';
  }
}