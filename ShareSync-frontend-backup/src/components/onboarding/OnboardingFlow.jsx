// src/components/onboarding/OnboardingFlow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Main Onboarding Flow Orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOnboarding from '../../hooks/useOnboarding';
import OnboardingProgress, { OnboardingDots } from './OnboardingProgress';
import WelcomeStep from './steps/WelcomeStep';
import ArchetypeStep from './steps/ArchetypeStep';
import FirstTaskStep from './steps/FirstTaskStep';
import MomentumStep from './steps/MomentumStep';
import api from '../../api/client';

export default function OnboardingFlow({ onComplete }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    currentStep,
    data,
    nextStep,
    prevStep,
    setArchetype,
    setFirstTask,
    setCommitment,
    completeOnboarding,
  } = useOnboarding();

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Save archetype preference
      await api.patch('/users/me', {
        archetype: data.archetype,
        onboardingCompleted: true,
      });
      
      // 2. Create first task
      if (data.firstTask) {
        const deadlineMap = {
          '24h': new Date(Date.now() + 24 * 60 * 60 * 1000),
          '48h': new Date(Date.now() + 48 * 60 * 60 * 1000),
          'week': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        
        await api.post('/tasks', {
          title: data.firstTask,
          deadline: deadlineMap[data.commitmentTime]?.toISOString(),
          priority: 'high',
          isFirstTask: true,
        });
      }
      
      // 3. Mark onboarding as complete locally
      completeOnboarding();
      
      // 4. Callback or navigate
      if (onComplete) {
        onComplete(data);
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      console.error('[Onboarding] Failed to complete:', err);
      setError('Something went wrong. Please try again.');
      
      // Still allow navigation even if API fails
      setTimeout(() => {
        completeOnboarding();
        navigate('/home', { replace: true });
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} />;
      
      case 1:
        return (
          <ArchetypeStep
            selectedArchetype={data.archetype}
            onSelect={setArchetype}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 2:
        return (
          <FirstTaskStep
            archetype={data.archetype}
            task={data.firstTask}
            onSetTask={setFirstTask}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 3:
        return (
          <MomentumStep
            archetype={data.archetype}
            task={data.firstTask}
            commitment={data.commitmentTime}
            onSetCommitment={setCommitment}
            onComplete={handleComplete}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Progress indicator */}
      <div className="pt-8 pb-4">
        {/* Desktop */}
        <div className="hidden sm:block">
          <OnboardingProgress currentStep={currentStep} />
        </div>
        {/* Mobile */}
        <div className="sm:hidden">
          <OnboardingDots currentStep={currentStep} />
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mx-auto max-w-md px-6 mb-4">
          <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
            {error}
          </div>
        </div>
      )}
      
      {/* Step content */}
      <div className="flex-1 flex items-center justify-center">
        {renderStep()}
      </div>
      
      {/* Skip option (only on first step) */}
      {currentStep === 0 && (
        <div className="pb-8 text-center">
          <button
            onClick={() => {
              completeOnboarding();
              navigate('/home', { replace: true });
            }}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
