// src/components/onboarding/steps/WelcomeStep.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Welcome Screen - Personalized greeting
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Rocket, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { OPENSHARE_MESSAGING } from '../../../content/openShareMessaging';

export default function WelcomeStep({ onNext }) {
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // Get first name
  const firstName =
    user?.firstName || user?.name?.split(' ')[0] || 'there';

  // Stagger animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {/* Animated rocket */}
      <div
        className={`
          mb-8 transition-all duration-700 ease-out
          ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }
        `}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent-500 shadow-lg shadow-brand/25">
          <Rocket className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Welcome text */}
      <h1
        className={`
          mb-4 text-4xl font-bold text-text-primary
          transition-all delay-100 duration-700 ease-out md:text-5xl
          ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }
        `}
      >
        Welcome, <span className="text-brand">{firstName}</span>
      </h1>

      {/* Level 1: global promise */}
      <p
        className={`
          mb-4 max-w-xl text-base leading-7 text-text-secondary
          transition-all delay-200 duration-700 ease-out sm:text-lg
          ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }
        `}
      >
        {OPENSHARE_MESSAGING.plainEnglish}
      </p>

      {/* Level 2: brand bridge */}
      <p
        className={`
          mb-10 max-w-lg text-sm leading-6 text-text-tertiary
          transition-all delay-300 duration-700 ease-out sm:text-base
          ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }
        `}
      >
        {OPENSHARE_MESSAGING.brandBridge}
      </p>

      {/* CTA Button */}
      <button
        onClick={onNext}
        className={`
          group flex items-center gap-3 rounded-xl bg-brand px-8 py-4
          text-lg font-semibold text-white transition-all duration-300
          hover:bg-brand-600 hover:shadow-glow-brand
          ${
            showContent
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }
        `}
        style={{ transitionDelay: showContent ? '400ms' : '0ms' }}
      >
        Let&apos;s Go
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
