// src/components/onboarding/steps/ArchetypeStep.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: "Who do you want to become?" - Pick your identity
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { ARCHETYPES } from '../../../data/archetypes';

function ArchetypeCard({ archetype, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(archetype.id)}
      className={`
        relative p-5 rounded-xl text-left transition-all duration-300
        border-2 group
        ${isSelected 
          ? 'bg-brand/10 border-brand shadow-glow-brand' 
          : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2 hover:border-white/[0.1]'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Emoji */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4
        transition-all duration-300
        ${isSelected ? 'bg-brand/20 scale-110' : 'bg-surface-2 group-hover:bg-brand/10'}
      `}>
        {archetype.emoji}
      </div>
      
      {/* Name & Tagline */}
      <h3 className={`
        text-lg font-semibold mb-1 transition-colors
        ${isSelected ? 'text-brand' : 'text-text-primary'}
      `}>
        {archetype.name}
      </h3>
      <p className="text-sm text-text-secondary mb-3">
        {archetype.tagline}
      </p>
      
      {/* Traits */}
      <div className="flex flex-wrap gap-1.5">
        {archetype.traits.map(trait => (
          <span 
            key={trait}
            className={`
              text-[10px] px-2 py-0.5 rounded-full font-medium
              ${isSelected 
                ? 'bg-brand/20 text-brand' 
                : 'bg-surface-2 text-text-tertiary'
              }
            `}
          >
            {trait}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function ArchetypeStep({ selectedArchetype, onSelect, onNext, onBack }) {
  const [showDescription, setShowDescription] = useState(false);
  const selected = ARCHETYPES.find(a => a.id === selectedArchetype);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          Who do you want to become?
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          This isn't a personality test. It's a declaration of intent.
          Pick the identity you're building toward.
        </p>
      </div>
      
      {/* Archetype Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {ARCHETYPES.map(archetype => (
          <ArchetypeCard
            key={archetype.id}
            archetype={archetype}
            isSelected={selectedArchetype === archetype.id}
            onSelect={onSelect}
          />
        ))}
      </div>
      
      {/* Selected Description */}
      {selected && (
        <div className="p-5 rounded-xl bg-surface-1 border border-brand/20 mb-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{selected.emoji}</div>
            <div>
              <h4 className="font-semibold text-text-primary mb-1">
                {selected.name}
              </h4>
              <p className="text-sm text-text-secondary mb-3">
                {selected.description}
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-success font-medium">Strength:</span>
                  <span className="text-text-tertiary ml-1">{selected.peakBehavior}</span>
                </div>
                <div>
                  <span className="text-warning font-medium">Watch out:</span>
                  <span className="text-text-tertiary ml-1">{selected.weakness}</span>
                </div>
              </div>
            </div>
          </div>
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
          onClick={onNext}
          disabled={!selectedArchetype}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium
            transition-all duration-300
            ${selectedArchetype 
              ? 'bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand' 
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
            }
          `}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
