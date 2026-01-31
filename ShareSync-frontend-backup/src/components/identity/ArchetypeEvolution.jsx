// src/components/identity/ArchetypeEvolution.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE: Archetype Evolution
// Shows archetype progress and unlocked abilities
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { 
  Zap, Lock, Star, ChevronRight, Sparkles,
  CheckCircle2, ArrowRight, Award
} from 'lucide-react';
import { ARCHETYPE_CONFIG, ARCHETYPE_LEVELS } from '../../hooks/useIdentityEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPE CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ArchetypeCard({
  archetype,
  config,
  level,
  xp,
  nextLevel,
  evolutionTitle,
  isSelected,
  onClick,
}) {
  const xpProgress = nextLevel 
    ? ((xp - level.xpRequired) / (nextLevel.xpRequired - level.xpRequired)) * 100
    : 100;
  
  const colorClasses = {
    brand: 'from-brand-500/20 to-purple-500/20 border-brand-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    warning: 'from-warning-500/20 to-orange-500/20 border-warning-500/30',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        p-6 rounded-2xl border-2 transition-all duration-300
        bg-gradient-to-br ${colorClasses[config.color] || colorClasses.brand}
        ${isSelected ? 'scale-105 shadow-xl' : 'hover:scale-102'}
      `}
    >
      {/* Icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-4xl mb-2 block">{config.icon}</span>
          <div className="text-xl font-bold text-text-primary">
            {evolutionTitle || config.name}
          </div>
          <div className="text-sm text-text-tertiary">
            Level {level.level} {level.name}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-400">{xp}</div>
          <div className="text-xs text-text-tertiary">XP</div>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-text-secondary mb-4">
        {config.description}
      </p>
      
      {/* Progress to next level */}
      {nextLevel && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-tertiary">Next: {nextLevel.name}</span>
            <span className="text-brand-400">{nextLevel.xpRequired - xp} XP to go</span>
          </div>
          <div className="h-2 bg-surface-3/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Max level indicator */}
      {!nextLevel && (
        <div className="flex items-center gap-2 text-warning-400">
          <Star className="w-4 h-4 fill-warning-400" />
          <span className="text-sm font-medium">Maximum Level!</span>
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVOLUTION PATH
// ═══════════════════════════════════════════════════════════════════════════════

function EvolutionPath({ evolution, currentLevel }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {evolution.map((title, idx) => {
        const isUnlocked = currentLevel >= (idx * 2) + 1;
        const isCurrent = currentLevel >= (idx * 2) + 1 && currentLevel < ((idx + 1) * 2) + 1;
        
        return (
          <React.Fragment key={title}>
            {idx > 0 && (
              <ArrowRight className={`w-4 h-4 ${isUnlocked ? 'text-brand-400' : 'text-text-tertiary'}`} />
            )}
            <div className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              ${isCurrent 
                ? 'bg-brand-500 text-white' 
                : isUnlocked 
                ? 'bg-brand-500/20 text-brand-400'
                : 'bg-surface-2 text-text-tertiary'
              }
            `}>
              {title}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABILITY CARD
// ═══════════════════════════════════════════════════════════════════════════════

function AbilityCard({ ability, isUnlocked, levelRequired }) {
  return (
    <div className={`
      p-4 rounded-xl border transition-all duration-200
      ${isUnlocked 
        ? 'bg-brand-500/10 border-brand-500/30' 
        : 'bg-surface-1 border-white/[0.06] opacity-60'
      }
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isUnlocked ? 'bg-brand-500/20' : 'bg-surface-2'}
        `}>
          {isUnlocked ? (
            <Zap className="w-5 h-5 text-brand-400" />
          ) : (
            <Lock className="w-5 h-5 text-text-tertiary" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary">
              {ability.name}
            </span>
            {!isUnlocked && (
              <span className="text-[10px] text-text-tertiary">
                Level {levelRequired}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary">
            {ability.description}
          </p>
        </div>
        
        {isUnlocked && (
          <CheckCircle2 className="w-5 h-5 text-brand-400" />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ARCHETYPE EVOLUTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ArchetypeEvolution - Full archetype view with abilities
 */
export function ArchetypeEvolution({
  archetype,
  archetypeConfig,
  archetypeLevel,
  nextLevel,
  evolutionTitle,
  xp,
  unlockedAbilities,
  onChangeArchetype,
  className = '',
}) {
  if (!archetypeConfig) return null;
  
  const allAbilities = Object.entries(archetypeConfig.abilities || {});
  
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
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Your Archetype
              </div>
              <div className="text-sm text-text-tertiary">
                Identity & abilities
              </div>
            </div>
          </div>
          
          {onChangeArchetype && (
            <button
              onClick={onChangeArchetype}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              Change
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Archetype card */}
        <ArchetypeCard
          archetype={archetype}
          config={archetypeConfig}
          level={archetypeLevel}
          xp={xp}
          nextLevel={nextLevel}
          evolutionTitle={evolutionTitle}
          isSelected
        />
        
        {/* Evolution path */}
        <div>
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3 text-center">
            Evolution Path
          </div>
          <EvolutionPath 
            evolution={archetypeConfig.evolution} 
            currentLevel={archetypeLevel.level}
          />
        </div>
        
        {/* Abilities */}
        <div>
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
            Abilities ({unlockedAbilities.length}/{allAbilities.length} unlocked)
          </div>
          <div className="space-y-3">
            {allAbilities.map(([levelStr, ability]) => {
              const level = parseInt(levelStr);
              const isUnlocked = archetypeLevel.level >= level;
              
              return (
                <AbilityCard
                  key={levelStr}
                  ability={ability}
                  isUnlocked={isUnlocked}
                  levelRequired={level}
                />
              );
            })}
          </div>
        </div>
        
        {/* Traits */}
        <div>
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
            Core Traits
          </div>
          <div className="flex flex-wrap gap-2">
            {archetypeConfig.traits?.map(trait => (
              <span
                key={trait}
                className="px-3 py-1.5 rounded-full bg-surface-2 text-text-secondary text-sm"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI ARCHETYPE BADGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniArchetypeBadge - Compact archetype display
 */
export function MiniArchetypeBadge({
  archetypeConfig,
  archetypeLevel,
  evolutionTitle,
  onClick,
  className = '',
}) {
  if (!archetypeConfig) return null;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        ${className}
      `}
    >
      <span className="text-2xl">{archetypeConfig.icon}</span>
      <div className="text-left">
        <div className="text-sm font-medium text-text-primary">
          {evolutionTitle || archetypeConfig.name}
        </div>
        <div className="text-xs text-text-tertiary">
          Level {archetypeLevel.level}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-text-tertiary ml-auto" />
    </button>
  );
}

export default ArchetypeEvolution;
