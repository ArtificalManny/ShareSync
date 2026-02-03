// src/components/views/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// VIEW COMPONENTS INDEX
// Export all project view components for easy importing
// ═══════════════════════════════════════════════════════════════════════════════

export { default as StackView } from './StackView';
export { default as FlowView } from './FlowView';
export { default as RoadmapView } from './RoadmapView';
export { default as RhythmView } from './RhythmView';
export { default as InsightsView } from './InsightsView';
export { default as ThreadsView } from './ThreadsView';
export { default as VaultView } from './VaultView';

// View configuration for ProjectHome
export const PROJECT_VIEWS = [
  { id: 'pulse', label: 'Pulse', description: 'Project heartbeat' },
  { id: 'stack', label: 'Stack', description: 'Your work queue' },
  { id: 'flow', label: 'Flow', description: 'Workflow lanes' },
  { id: 'roadmap', label: 'Roadmap', description: 'Timeline view' },
  { id: 'rhythm', label: 'Rhythm', description: 'Schedule & tempo' },
  { id: 'insights', label: 'Insights', description: 'AI analytics' },
  { id: 'threads', label: 'Threads', description: 'Conversations' },
  { id: 'vault', label: 'Vault', description: 'Files & assets' },
];
