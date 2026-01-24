// src/components/empty-states/EmptyProjects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Empty Projects
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shown when a user has no projects yet.
// This is their first impression of what ShareSync can do!
//
// Key messaging:
// - "Your first project is waiting to be born"
// - Exciting, not sad
// - Quick start options
// - Shows the value they'll get
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Rocket, 
  Sparkles, 
  Zap, 
  Target,
  Calendar,
  Code,
  Lightbulb,
  ArrowRight,
  Command,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { RocketIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK START TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════
const PROJECT_TEMPLATES = [
  {
    id: 'blank',
    icon: Plus,
    title: 'Blank Project',
    description: 'Start from scratch',
    color: 'brand',
  },
  {
    id: 'sprint',
    icon: Zap,
    title: 'Sprint',
    description: '2-week focused work',
    color: 'cyan',
  },
  {
    id: 'feature',
    icon: Code,
    title: 'Feature Build',
    description: 'Ship a new feature',
    color: 'brand',
  },
  {
    id: 'goal',
    icon: Target,
    title: 'Goal Tracker',
    description: 'Track a big objective',
    color: 'success',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const TemplateCard = ({ template, onSelect, index }) => {
  const { glowLevel } = useMomentumContext();
  const Icon = template.icon;
  
  const colorMap = {
    brand: {
      bg: 'bg-brand-500/10 hover:bg-brand-500/20',
      icon: 'text-brand-400',
      border: 'border-brand-500/20',
      glow: 'hover:shadow-glow-brand',
    },
    cyan: {
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      icon: 'text-cyan-400',
      border: 'border-cyan-500/20',
      glow: 'hover:shadow-glow-cyan',
    },
    success: {
      bg: 'bg-success-500/10 hover:bg-success-500/20',
      icon: 'text-success-400',
      border: 'border-success-500/20',
      glow: 'hover:shadow-glow-success',
    },
  };
  
  const colors = colorMap[template.color] || colorMap.brand;
  
  return (
    <motion.button
      onClick={() => onSelect(template)}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl
        ${colors.bg}
        border ${colors.border}
        transition-all duration-200
        ${glowLevel >= 3 ? colors.glow : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-text-primary">{template.title}</div>
        <div className="text-xs text-text-tertiary">{template.description}</div>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALUE PROPOSITION BADGES
// ═══════════════════════════════════════════════════════════════════════════════
const ValueBadges = () => {
  const badges = [
    { icon: Sparkles, text: 'Earn XP as you ship' },
    { icon: Target, text: 'Track progress visually' },
    { icon: Rocket, text: 'Build momentum' },
  ];
  
  return (
    <motion.div 
      className="flex flex-wrap justify-center gap-3 mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      {badges.map((badge, i) => (
        <div 
          key={i}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 text-xs text-text-secondary"
        >
          <badge.icon className="w-3.5 h-3.5 text-brand-400" />
          <span>{badge.text}</span>
        </div>
      ))}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyProjects({
  onCreateProject,
  onSelectTemplate,
  showTemplates = true,
  variant = 'illustrated', // 'minimal' | 'illustrated' | 'animated'
  className = '',
}) {
  const { glowLevel, isFireMode } = useMomentumContext();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else if (onCreateProject) {
      onCreateProject(template);
    }
  };
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-6 h-6 text-brand-400" />
        </div>
        <p className="text-sm text-text-secondary mb-4">No projects yet</p>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <EmptyState
        illustration={RocketIllustration}
        title="Your first project is waiting to be born"
        description="Projects are where the magic happens. Ship tasks, earn XP, build momentum, and watch your productivity soar."
        primaryAction={onCreateProject}
        primaryActionLabel="Create Your First Project"
        primaryActionIcon={Rocket}
        keyboardShortcut="⌘N"
        variant={variant}
        size="large"
        accentColor={isFireMode ? 'energy' : 'brand'}
      >
        {/* Quick Start Templates */}
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-4">
              Or start with a template
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {PROJECT_TEMPLATES.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Value badges */}
        <ValueBadges />
      </EmptyState>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for sidebars, panels)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyProjectsCompact({ onCreateProject, className = '' }) {
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Rocket className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary mb-1">
            Launch your first project
          </h4>
          <p className="text-xs text-text-tertiary mb-3">
            Start shipping and earning XP today
          </p>
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE VARIANT (for lists)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyProjectsInline({ onCreateProject, className = '' }) {
  return (
    <button
      onClick={onCreateProject}
      className={`
        w-full flex items-center gap-3 p-4 rounded-xl
        bg-surface-1 border border-white/[0.06] border-dashed
        hover:border-brand-500/30 hover:bg-surface-2
        transition-all duration-200
        group
        ${className}
      `}
    >
      <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
        <Plus className="w-5 h-5 text-brand-400" />
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-text-primary">Create your first project</div>
        <div className="text-xs text-text-tertiary">Start building momentum today</div>
      </div>
      <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}
