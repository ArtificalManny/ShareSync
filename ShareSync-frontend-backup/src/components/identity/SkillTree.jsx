// src/components/identity/SkillTree.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE: Skill Tree Visualization
// Interactive skill tree showing growth areas
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, Lock, Star, Zap, TrendingUp,
  Award, Target, CheckCircle2
} from 'lucide-react';
import { SKILLS, SKILL_CATEGORIES, SKILL_TREE } from '../../hooks/useIdentityEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORY_COLORS = {
  [SKILL_CATEGORIES.EXECUTION]: {
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    borderColor: 'border-brand-500/30',
    barColor: 'bg-brand-500',
  },
  [SKILL_CATEGORIES.STRATEGY]: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    barColor: 'bg-purple-500',
  },
  [SKILL_CATEGORIES.COMMUNICATION]: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    barColor: 'bg-cyan-500',
  },
  [SKILL_CATEGORIES.LEADERSHIP]: {
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    barColor: 'bg-warning-500',
  },
  [SKILL_CATEGORIES.TECHNICAL]: {
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
    barColor: 'bg-success-500',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL NODE
// ═══════════════════════════════════════════════════════════════════════════════

function SkillNode({
  skillId,
  skill,
  levelData,
  isSelected,
  onClick,
  size = 'md',
}) {
  const categoryColors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS[SKILL_CATEGORIES.EXECUTION];
  const level = levelData?.level || 1;
  const progress = levelData?.progress || 0;
  const isMaxed = level >= skill.maxLevel;
  
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };
  
  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-2xl flex flex-col items-center justify-center
        border-2 transition-all duration-300
        ${sizeClasses[size]}
        ${isSelected 
          ? `${categoryColors.bgColor} ${categoryColors.borderColor} scale-110 shadow-lg` 
          : 'bg-surface-1 border-white/[0.06] hover:border-white/[0.1] hover:scale-105'
        }
      `}
    >
      {/* Level badge */}
      <div className={`
        absolute -top-2 -right-2 w-6 h-6 rounded-full
        flex items-center justify-center text-xs font-bold
        ${isMaxed 
          ? 'bg-warning-500 text-white' 
          : categoryColors.bgColor + ' ' + categoryColors.color
        }
      `}>
        {isMaxed ? <Star className="w-3 h-3" /> : level}
      </div>
      
      {/* Icon */}
      <span className={iconSizes[size]}>{skill.icon}</span>
      
      {/* Name */}
      <span className="text-[10px] text-text-tertiary mt-1 text-center leading-tight">
        {skill.name}
      </span>
      
      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke={isMaxed ? '#F59E0B' : categoryColors.barColor.replace('bg-', 'var(--color-').replace('500', '500)')}
          strokeWidth="3"
          strokeDasharray={`${progress * 2.83} 283`}
          className="transition-all duration-500"
          style={{
            stroke: isMaxed 
              ? '#F59E0B' 
              : `rgb(var(--color-${skill.category === SKILL_CATEGORIES.EXECUTION ? 'brand' : skill.category}-500))`
          }}
        />
      </svg>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function SkillDetailPanel({
  skillId,
  skill,
  levelData,
  onClose,
}) {
  if (!skill) return null;
  
  const categoryColors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS[SKILL_CATEGORIES.EXECUTION];
  const level = levelData?.level || 1;
  const progress = levelData?.progress || 0;
  const totalProgress = levelData?.totalProgress || 0;
  const isMaxed = level >= skill.maxLevel;
  
  const xpToNext = 100 - progress;
  
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.08]">
      <div className="flex items-start gap-4 mb-4">
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center text-3xl
          ${categoryColors.bgColor}
        `}>
          {skill.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-text-primary">
              {skill.name}
            </h3>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${categoryColors.bgColor} ${categoryColors.color}
            `}>
              Level {level}/{skill.maxLevel}
            </span>
          </div>
          
          <p className="text-sm text-text-tertiary">
            Category: {skill.category.charAt(0).toUpperCase() + skill.category.slice(1)}
          </p>
        </div>
        
        {isMaxed && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning-500/20 text-warning-400 text-xs">
            <Star className="w-3 h-3" />
            <span>Mastered</span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-tertiary">Progress to Level {level + 1}</span>
          <span className={categoryColors.color}>{progress}%</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${categoryColors.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {!isMaxed && (
          <div className="text-xs text-text-tertiary mt-1">
            {xpToNext} XP to next level
          </div>
        )}
      </div>
      
      {/* Level benefits */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Level Benefits
        </div>
        {[1, 3, 5, 7, 10].map(lvl => (
          <div 
            key={lvl}
            className={`
              flex items-center gap-2 text-sm
              ${level >= lvl ? 'text-text-primary' : 'text-text-tertiary'}
            `}
          >
            {level >= lvl ? (
              <CheckCircle2 className={`w-4 h-4 ${categoryColors.color}`} />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>Level {lvl}: Unlock {skill.name} bonus #{Math.ceil(lvl / 2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function CategorySection({
  category,
  skills,
  skillLevels,
  selectedSkill,
  onSelectSkill,
}) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS[SKILL_CATEGORIES.EXECUTION];
  const categorySkills = Object.entries(skills).filter(([_, s]) => s.category === category);
  
  // Calculate category average
  const avgLevel = categorySkills.reduce((sum, [id]) => 
    sum + (skillLevels[id]?.level || 1), 0
  ) / categorySkills.length;
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colors.barColor}`} />
          <span className="text-sm font-medium text-text-primary capitalize">
            {category}
          </span>
        </div>
        <span className={`text-xs ${colors.color}`}>
          Avg Level {avgLevel.toFixed(1)}
        </span>
      </div>
      
      <div className="flex gap-3 flex-wrap">
        {categorySkills.map(([id, skill]) => (
          <SkillNode
            key={id}
            skillId={id}
            skill={skill}
            levelData={skillLevels[id]}
            isSelected={selectedSkill === id}
            onClick={() => onSelectSkill(id)}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SKILL TREE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SkillTree - Full skill tree visualization
 */
export function SkillTree({
  skillLevels = {},
  onSkillSelect,
  className = '',
}) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const handleSelectSkill = (skillId) => {
    setSelectedSkill(skillId === selectedSkill ? null : skillId);
    onSkillSelect?.(skillId);
  };
  
  const selectedSkillData = selectedSkill ? SKILLS[selectedSkill] : null;
  
  // Calculate total level
  const totalLevel = useMemo(() => 
    Object.values(skillLevels).reduce((sum, s) => sum + (s?.level || 1), 0),
    [skillLevels]
  );
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Skill Tree
              </div>
              <div className="text-sm text-text-tertiary">
                Your growth journey
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-400">{totalLevel}</div>
            <div className="text-xs text-text-tertiary">Total Levels</div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex gap-6">
          {/* Skill grid */}
          <div className="flex-1">
            {Object.values(SKILL_CATEGORIES).map(category => (
              <CategorySection
                key={category}
                category={category}
                skills={SKILLS}
                skillLevels={skillLevels}
                selectedSkill={selectedSkill}
                onSelectSkill={handleSelectSkill}
              />
            ))}
          </div>
          
          {/* Detail panel */}
          {selectedSkillData && (
            <div className="w-72 flex-shrink-0">
              <SkillDetailPanel
                skillId={selectedSkill}
                skill={selectedSkillData}
                levelData={skillLevels[selectedSkill]}
                onClose={() => setSelectedSkill(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI SKILL PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniSkillPreview - Compact skill overview for profiles
 */
export function MiniSkillPreview({
  skillLevels = {},
  topCount = 5,
  onClick,
  className = '',
}) {
  // Get top skills by level
  const topSkills = useMemo(() => {
    return Object.entries(skillLevels)
      .map(([id, data]) => ({
        id,
        skill: SKILLS[id],
        level: data?.level || 1,
        progress: data?.progress || 0,
      }))
      .filter(s => s.skill)
      .sort((a, b) => b.level - a.level || b.progress - a.progress)
      .slice(0, topCount);
  }, [skillLevels, topCount]);
  
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left w-full
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">Top Skills</span>
        <ChevronRight className="w-4 h-4 text-text-tertiary" />
      </div>
      
      <div className="flex gap-2">
        {topSkills.map(({ id, skill, level }) => (
          <div
            key={id}
            className="flex flex-col items-center"
            title={`${skill.name}: Level ${level}`}
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-xl mb-1">
              {skill.icon}
            </div>
            <span className="text-[10px] text-text-tertiary">Lv.{level}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

export default SkillTree;
