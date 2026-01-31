// src/components/identity/CareerNarrative.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE: Career Narrative
// Auto-generated story of your professional growth
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Download, ChevronRight, TrendingUp, Star,
  Award, Target, Users, Calendar, BarChart2, Sparkles,
  FileText, Share2, CheckCircle2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// HIGHLIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function HighlightCard({ highlight, index }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50">
      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
        <Star className="w-4 h-4 text-brand-400" />
      </div>
      <div>
        <div className="text-sm text-text-primary">{highlight}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH AREA CARD
// ═══════════════════════════════════════════════════════════════════════════════

function GrowthAreaCard({ growth }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-success-500/5 border border-success-500/20">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-4 h-4 text-success-400" />
        <span className="text-sm text-text-primary">{growth.skill}</span>
      </div>
      <span className="text-sm font-bold text-success-400">
        +{growth.percentage}%
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRENGTH BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function StrengthBadge({ strength }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-500/10 border border-warning-500/30">
      <span className="text-lg">{strength.icon}</span>
      <span className="text-sm text-warning-400">{strength.name}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS GRID
// ═══════════════════════════════════════════════════════════════════════════════

function StatsGrid({ stats }) {
  const items = [
    { label: 'Tasks Completed', value: stats.tasksCompleted || 0, icon: CheckCircle2, color: 'brand' },
    { label: 'Focus Hours', value: `${stats.focusHours || 0}h`, icon: Target, color: 'purple' },
    { label: 'Teammates Helped', value: stats.teammatesHelped || 0, icon: Users, color: 'cyan' },
    { label: 'Current Streak', value: `${stats.streak || 0}d`, icon: Sparkles, color: 'warning' },
  ];
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div 
            key={item.label}
            className="p-3 rounded-xl bg-surface-1 border border-white/[0.06]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 text-${item.color}-400`} />
              <span className="text-xs text-text-tertiary">{item.label}</span>
            </div>
            <div className="text-xl font-bold text-text-primary">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CAREER NARRATIVE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CareerNarrative - Full career story view
 */
export function CareerNarrative({
  narrative,
  stats = {},
  userName = 'User',
  periodOptions = ['Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024'],
  selectedPeriod,
  onPeriodChange,
  onExport,
  onShare,
  className = '',
}) {
  if (!narrative) return null;
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Career Narrative
              </div>
              <div className="text-sm text-text-tertiary">
                Your professional story
              </div>
            </div>
          </div>
          
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod || periodOptions[0]}
              onChange={(e) => onPeriodChange?.(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface-2 border border-white/[0.06] text-text-primary text-sm"
            >
              {periodOptions.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Summary narrative */}
        <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-text-secondary">Summary</span>
          </div>
          <p className="text-text-primary leading-relaxed">
            {narrative.summary}
          </p>
        </div>
        
        {/* Stats grid */}
        <StatsGrid stats={stats} />
        
        {/* Highlights */}
        {narrative.highlights?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-warning-400" />
              <span className="text-sm font-medium text-text-secondary">Highlights</span>
            </div>
            <div className="space-y-2">
              {narrative.highlights.map((highlight, idx) => (
                <HighlightCard key={idx} highlight={highlight} index={idx} />
              ))}
            </div>
          </div>
        )}
        
        {/* Growth areas */}
        {narrative.growth?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-success-400" />
              <span className="text-sm font-medium text-text-secondary">
                Biggest Growth Areas
              </span>
            </div>
            <div className="space-y-2">
              {narrative.growth.map((growth, idx) => (
                <GrowthAreaCard key={idx} growth={growth} />
              ))}
            </div>
          </div>
        )}
        
        {/* Strengths (reputation) */}
        {narrative.strengths?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-warning-400" />
              <span className="text-sm font-medium text-text-secondary">
                Known Strengths
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {narrative.strengths.map((strength, idx) => (
                <StrengthBadge key={idx} strength={strength} />
              ))}
            </div>
          </div>
        )}
        
        {/* Export/Share actions */}
        <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
          {onExport && (
            <button
              onClick={onExport}
              className="
                flex-1 py-3 rounded-xl
                bg-brand-500 text-white font-medium
                hover:bg-brand-400 transition-colors
                flex items-center justify-center gap-2
              "
            >
              <Download className="w-4 h-4" />
              <span>Export for Review</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="
                px-4 py-3 rounded-xl
                bg-surface-2 text-text-secondary
                hover:bg-surface-3 transition-colors
              "
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CAREER WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniCareerWidget - Compact career preview for dashboard
 */
export function MiniCareerWidget({
  narrative,
  period = 'Q4 2024',
  onClick,
  className = '',
}) {
  const topGrowth = narrative?.growth?.[0];
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left group
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-text-primary">{period} Story</span>
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
      </div>
      
      {narrative?.summary ? (
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {narrative.summary}
        </p>
      ) : (
        <p className="text-sm text-text-tertiary mb-3">
          Your career story is being written...
        </p>
      )}
      
      {topGrowth && (
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="w-3 h-3 text-success-400" />
          <span className="text-success-400">
            {topGrowth.skill} +{topGrowth.percentage}%
          </span>
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTABLE NARRATIVE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate exportable text for performance reviews
 */
export function generateExportableNarrative(narrative, stats, userName) {
  if (!narrative) return '';
  
  let text = `# Career Narrative - ${narrative.period}\n`;
  text += `## ${userName}\n\n`;
  
  text += `### Summary\n${narrative.summary}\n\n`;
  
  if (stats) {
    text += `### Key Metrics\n`;
    text += `- Tasks Completed: ${stats.tasksCompleted || 0}\n`;
    text += `- Focus Hours: ${stats.focusHours || 0}\n`;
    text += `- Teammates Helped: ${stats.teammatesHelped || 0}\n`;
    text += `- Longest Streak: ${stats.streak || 0} days\n\n`;
  }
  
  if (narrative.highlights?.length > 0) {
    text += `### Highlights\n`;
    narrative.highlights.forEach(h => {
      text += `- ${h}\n`;
    });
    text += '\n';
  }
  
  if (narrative.growth?.length > 0) {
    text += `### Growth Areas\n`;
    narrative.growth.forEach(g => {
      text += `- ${g.skill}: +${g.percentage}%\n`;
    });
    text += '\n';
  }
  
  if (narrative.strengths?.length > 0) {
    text += `### Known Strengths\n`;
    narrative.strengths.forEach(s => {
      text += `- ${s.name}\n`;
    });
  }
  
  return text;
}

export default CareerNarrative;
