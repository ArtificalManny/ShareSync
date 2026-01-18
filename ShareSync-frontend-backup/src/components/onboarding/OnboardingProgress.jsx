// src/components/onboarding/OnboardingProgress.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Step Progress Indicator
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Check } from 'lucide-react';
import { ONBOARDING_STEPS } from '../../hooks/useOnboarding';

export default function OnboardingProgress({ currentStep, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {ONBOARDING_STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <React.Fragment key={step.id}>
            {/* Step dot */}
            <div className={`
              relative flex items-center justify-center
              w-8 h-8 rounded-full transition-all duration-300
              ${isCompleted 
                ? 'bg-brand text-white' 
                : isCurrent 
                  ? 'bg-brand/20 text-brand border-2 border-brand' 
                  : 'bg-surface-2 text-text-tertiary'
              }
            `}>
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
              
              {/* Pulse animation for current step */}
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
              )}
            </div>
            
            {/* Connector line */}
            {index < ONBOARDING_STEPS.length - 1 && (
              <div className={`
                w-8 h-0.5 transition-all duration-300
                ${index < currentStep ? 'bg-brand' : 'bg-surface-3'}
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Minimal dot-style progress (for mobile)
 */
export function OnboardingDots({ currentStep, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {ONBOARDING_STEPS.map((_, index) => (
        <div
          key={index}
          className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${index === currentStep 
              ? 'w-6 bg-brand' 
              : index < currentStep 
                ? 'bg-brand' 
                : 'bg-surface-3'
            }
          `}
        />
      ))}
    </div>
  );
}
