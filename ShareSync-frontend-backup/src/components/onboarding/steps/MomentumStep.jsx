// src/components/onboarding/steps/MomentumStep.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: "Ship it in 24 hours" - Commitment screen
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ArrowLeft, Rocket, Clock, Calendar, Zap, Check } from 'lucide-react';
import { getArchetypeById } from '../../../data/archetypes';

const COMMITMENT_OPTIONS = [
  {
    id: '24h',
    label: '24 Hours',
    description: 'Maximum momentum',
    icon: Zap,
    color: 'brand',
    recommended: true,
  },
  {
    id: '48h',
    label: '48 Hours',
    description: 'Comfortable pace',
    icon: Clock,
    color: 'success',
    recommended: false,
  },
  {
    id: 'week',
    label: 'This Week',
    description: 'Flexible timing',
    icon: Calendar,
    color: 'info',
    recommended: false,
  },
];

export default function MomentumStep({ 
  archetype, 
  task, 
  commitment, 
  onSetCommitment, 
  onComplete, 
  onBack,
  isSubmitting = false,
}) {
  const archetypeData = getArchetypeById(archetype);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-6">
          <Rocket className="w-8 h-8 text-brand" />
        </div>
        
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          When will you ship it?
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Momentum comes from action, not intention. 
          Pick a deadline and make it real.
        </p>
      </div>
      
      {/* Task Preview */}
      <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06] mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-xl shrink-0">
            {archetypeData?.emoji || '🎯'}
          </div>
          <div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
              Your First Mission
            </div>
            <p className="text-text-primary font-medium">
              {task}
            </p>
          </div>
        </div>
      </div>
      
      {/* Commitment Options */}
      <div className="space-y-3 mb-10">
        {COMMITMENT_OPTIONS.map(option => {
          const Icon = option.icon;
          const isSelected = commitment === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onSetCommitment(option.id)}
              className={`
                relative w-full p-5 rounded-xl text-left transition-all duration-300
                border-2 group flex items-center gap-4
                ${isSelected 
                  ? 'bg-brand/10 border-brand' 
                  : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2 hover:border-white/[0.1]'
                }
              `}
            >
              {/* Icon */}
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                transition-all duration-300
                ${isSelected ? 'bg-brand/20' : 'bg-surface-2 group-hover:bg-brand/10'}
              `}>
                <Icon className={`w-6 h-6 ${isSelected ? 'text-brand' : 'text-text-tertiary'}`} />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${isSelected ? 'text-brand' : 'text-text-primary'}`}>
                    {option.label}
                  </h4>
                  {option.recommended && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/20 text-brand font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {option.description}
                </p>
              </div>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Motivation text */}
      {commitment === '24h' && (
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-sm text-brand">
            🔥 Bold choice. {archetypeData?.name}s thrive under pressure.
          </p>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <button
          onClick={onComplete}
          disabled={!commitment || isSubmitting}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-lg
            transition-all duration-300
            ${commitment && !isSubmitting
              ? 'bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand' 
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Start My Journey
            </>
          )}
        </button>
      </div>
    </div>
  );
}
