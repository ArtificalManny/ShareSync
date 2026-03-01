// src/projects/templates/project-templates.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PRIORITY 1: Project Templates for Zero-State Revolution
// Pre-populated projects that make the app feel alive from day one.
// Each template creates a project + 4-5 starter tasks with descriptions.
// ═══════════════════════════════════════════════════════════════════════════════

export type TemplateType = 'personal' | 'team' | 'learning';

export interface TemplateTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface ProjectTemplate {
  type: TemplateType;
  name: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
  suggestedView: 'pulse' | 'stack' | 'flow' | 'roadmap' | 'rhythm';
  tasks: TemplateTask[];
}

export const PROJECT_TEMPLATES: Record<TemplateType, ProjectTemplate> = {
  personal: {
    type: 'personal',
    name: 'My Goals',
    description: 'Track your goals, habits, and side projects',
    emoji: '🎯',
    color: '#7C3AED',
    category: 'Personal',
    suggestedView: 'stack',
    tasks: [
      {
        title: 'Define my top 3 goals this month',
        description: 'Write down the 3 most important things you want to accomplish. Be specific — "Read 2 books" beats "Read more."',
        priority: 'high',
        tags: ['planning', 'goals'],
      },
      {
        title: 'Break my biggest goal into 5 steps',
        description: 'Take your #1 goal and split it into smaller, concrete actions you can check off one by one.',
        priority: 'high',
        tags: ['planning'],
      },
      {
        title: 'Complete my first task and ship it',
        description: 'This is your momentum starter. Finish one small thing and feel the XP hit. Every streak starts here.',
        priority: 'medium',
        tags: ['starter'],
      },
      {
        title: 'Set up a daily check-in habit',
        description: 'Spend 2 minutes each morning reviewing your tasks. Consistency beats intensity.',
        priority: 'low',
        tags: ['habits'],
      },
      {
        title: 'Celebrate my first 3-day streak',
        description: 'Ship something 3 days in a row. Watch the flame grow. You\'ve got this.',
        priority: 'low',
        tags: ['milestone', 'streak'],
      },
    ],
  },

  team: {
    type: 'team',
    name: 'Team Project',
    description: 'Ship features, fix bugs, hit deadlines together',
    emoji: '🚀',
    color: '#2563EB',
    category: 'Job',
    suggestedView: 'flow',
    tasks: [
      {
        title: 'Define project scope and requirements',
        description: 'Write a clear one-pager: what are we building, who is it for, and what does "done" look like?',
        priority: 'critical',
        tags: ['planning', 'scope'],
      },
      {
        title: 'Set up project milestones',
        description: 'Break the project into 3-5 milestones with rough target dates. This powers your Roadmap view.',
        priority: 'high',
        tags: ['planning', 'milestones'],
      },
      {
        title: 'Create and assign first sprint tasks',
        description: 'Add your first batch of tasks and assign them to team members. Use the Flow view for kanban-style tracking.',
        priority: 'high',
        tags: ['sprint', 'tasks'],
      },
      {
        title: 'Ship the first feature or fix',
        description: 'Get something out the door. First ship is the hardest — after that, momentum takes over.',
        priority: 'medium',
        tags: ['shipping'],
      },
      {
        title: 'Run your first team standup',
        description: 'Check in with your team: What shipped yesterday? What\'s the focus today? Any blockers?',
        priority: 'low',
        tags: ['standup', 'team'],
      },
    ],
  },

  learning: {
    type: 'learning',
    name: 'Learning Path',
    description: 'Courses, study plans, and skill building',
    emoji: '📚',
    color: '#059669',
    category: 'School',
    suggestedView: 'stack',
    tasks: [
      {
        title: 'Choose what I want to learn',
        description: 'Pick one skill or subject to focus on. Specificity matters: "Learn React hooks" beats "Learn coding."',
        priority: 'high',
        tags: ['planning', 'learning'],
      },
      {
        title: 'Find my learning resources',
        description: 'Gather 2-3 resources (course, tutorial, book). Don\'t over-research — pick and start.',
        priority: 'high',
        tags: ['resources'],
      },
      {
        title: 'Complete first lesson or chapter',
        description: 'Do the first unit and take notes. Ship it to earn XP and start your learning streak.',
        priority: 'medium',
        tags: ['learning', 'starter'],
      },
      {
        title: 'Build something small with what I learned',
        description: 'Apply your knowledge immediately. Even a tiny project cements understanding better than passive study.',
        priority: 'medium',
        tags: ['practice', 'project'],
      },
    ],
  },
};

/**
 * Returns a template by type, or throws if invalid.
 */
export function getProjectTemplate(type: TemplateType): ProjectTemplate {
  const template = PROJECT_TEMPLATES[type];
  if (!template) {
    throw new Error(`Invalid template type: "${type}". Valid types: personal, team, learning`);
  }
  return template;
}
