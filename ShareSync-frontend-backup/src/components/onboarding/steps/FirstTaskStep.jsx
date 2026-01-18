// src/components/onboarding/steps/FirstTaskStep.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: "What's one thing you've been avoiding?" - Create first task
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Lightbulb, Zap } from 'lucide-react';
import { getArchetypeById } from '../../../data/archetypes';

const SUGGESTIONS = {
  builder: [
    "Ship that feature I've been stuck on",
    "Deploy the thing that's 90% done",
    "Fix that bug I keep postponing",
  ],
  strategist: [
    "Write the project plan I've been avoiding",
    "Have that difficult conversation",
    "Make the decision I've been delaying",
  ],
  finisher: [
    "Close out that almost-done project",
    "Send the final deliverable",
    "Complete the documentation",
  ],
  explorer: [
    "Try that new approach I've been curious about",
    "Prototype the idea in my head",
    "Research the thing I keep bookmarking",
  ],
};

export default function FirstTaskStep({ archetype, task, onSetTask, onNext, onBack }) {
  const [inputValue, setInputValue] = useState(task || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const archetypeData = getArchetypeById(archetype);
  const suggestions = SUGGESTIONS[archetype] || SUGGESTIONS.builder;

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    onSetTask(suggestion);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onSetTask(e.target.value);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSetTask(inputValue.trim());
      onNext();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-6">
          <Lightbulb className="w-8 h-8 text-warning" />
        </div>
        
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          What's one thing you've been avoiding?
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Not a whole project. Just one task. The thing that's been sitting 
          in the back of your mind, waiting.
        </p>
      </div>
      
      {/* Input */}
      <div className={`
        relative mb-6 transition-all duration-300
        ${isFocused ? 'scale-[1.02]' : 'scale-100'}
      `}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="I need to..."
          className={`
            w-full px-6 py-5 rounded-xl text-lg
            bg-surface-1 border-2 transition-all duration-300
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none
            ${isFocused 
              ? 'border-brand shadow-glow-brand' 
              : 'border-white/[0.06] hover:border-white/[0.1]'
            }
          `}
        />
        
        {/* Character hint */}
        {inputValue.length > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
            {inputValue.length}/100
          </div>
        )}
      </div>
      
      {/* Suggestions */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-brand" />
          <span className="text-xs text-text-tertiary uppercase tracking-wider">
            Suggestions for {archetypeData?.name || 'you'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                px-4 py-2 rounded-lg text-sm transition-all duration-200
                ${inputValue === suggestion 
                  ? 'bg-brand/20 text-brand border border-brand/30' 
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary border border-transparent'
                }
              `}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
      
      {/* Encouragement */}
      {inputValue.length > 10 && (
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-sm text-success">
            ✓ Great choice. This is exactly the kind of thing that builds momentum.
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
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium
            transition-all duration-300
            ${inputValue.trim() 
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
