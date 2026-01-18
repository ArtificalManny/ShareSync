// src/components/onboarding/steps/WelcomeStep.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Welcome Screen - Personalized greeting
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Rocket, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function WelcomeStep({ onNext }) {
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  
  // Get first name
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';
  
  // Stagger animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      {/* Animated rocket */}
      <div className={`
        mb-8 transition-all duration-700 ease-out
        ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-accent-500 flex items-center justify-center shadow-lg shadow-brand/25">
          <Rocket className="w-10 h-10 text-white" />
        </div>
      </div>
      
      {/* Welcome text */}
      <h1 className={`
        text-4xl md:text-5xl font-bold text-text-primary mb-4
        transition-all duration-700 delay-100 ease-out
        ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        Welcome, <span className="text-brand">{firstName}</span>
      </h1>
      
      <p className={`
        text-lg text-text-secondary max-w-md mb-8
        transition-all duration-700 delay-200 ease-out
        ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        You're not here to manage tasks.<br />
        You're here to <span className="text-text-primary font-medium">become someone who ships</span>.
      </p>
      
      {/* Subtitle */}
      <p className={`
        text-sm text-text-tertiary max-w-sm mb-12
        transition-all duration-700 delay-300 ease-out
        ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        Let's take 60 seconds to set you up for momentum.
      </p>
      
      {/* CTA Button */}
      <button
        onClick={onNext}
        className={`
          group flex items-center gap-3 px-8 py-4 rounded-xl
          bg-brand text-white font-semibold text-lg
          hover:bg-brand-600 hover:shadow-glow-brand
          transition-all duration-300
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
        style={{ transitionDelay: showContent ? '400ms' : '0ms' }}
      >
        Let's Go
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
