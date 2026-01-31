// src/components/billing/LimitReachedModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Graceful Limit Handling Modal
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { X, AlertCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';
import { PLAN_TIERS } from '../../api/billing';

const LIMIT_MESSAGES = {
  projects: {
    title: "Project limit reached",
    description: "You've created all the projects available on your current plan.",
    benefit: "Upgrade to Plus for 10 projects, or Team for unlimited.",
  },
  storage: {
    title: "Storage limit reached",
    description: "You've used all your storage space.",
    benefit: "Upgrade to Plus for 10 GB, or Team for 100 GB.",
  },
  aiCredits: {
    title: "AI credits depleted",
    description: "You've used all your AI credits for this month.",
    benefit: "Upgrade to Plus for 1,000 credits/month.",
  },
  shipsThisMonth: {
    title: "Ship limit reached",
    description: "You've shipped the maximum times this month.",
    benefit: "Upgrade to Plus for 500 ships/month.",
  },
  members: {
    title: "Member limit reached",
    description: "This project has reached its member limit.",
    benefit: "Upgrade to Plus for 15 members, or Team for unlimited.",
  },
};

export default function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  onUpgrade,
  onWaitlist,
}) {
  const { planId, canSeeUpgradePrompts } = usePlan();

  if (!isOpen) return null;

  const message = LIMIT_MESSAGES[limitType] || {
    title: "Limit reached",
    description: "You've reached a limit on your current plan.",
    benefit: "Upgrade to unlock more.",
  };

  const canUpgrade = canSeeUpgradePrompts();
  const nextPlan = planId === 'free' ? PLAN_TIERS.plus : PLAN_TIERS.team;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full max-w-md
        bg-surface-1 border border-white/[0.08] rounded-2xl
        animate-in zoom-in-95 duration-200
        overflow-hidden
      ">
        {/* Top Banner */}
        <div className="bg-warning/10 border-b border-warning/20 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">{message.title}</h2>
              <p className="text-sm text-text-tertiary">{message.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefit Message */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-brand/5 border border-brand/10 mb-6">
            <Sparkles className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">{message.benefit}</p>
          </div>

          {/* Upgrade CTA */}
          {canUpgrade ? (
            <div className="space-y-3">
              <button
                onClick={onUpgrade}
                className="
                  w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-brand text-white font-medium
                  hover:bg-brand-600 transition-colors
                "
              >
                <Zap className="w-4 h-4" />
                Upgrade to {nextPlan.name} - ${nextPlan.price}/mo
              </button>

              <button
                onClick={onClose}
                className="
                  w-full py-3 rounded-xl
                  bg-surface-2 text-text-secondary
                  hover:bg-surface-3 transition-colors
                "
              >
                Maybe later
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-2/50 text-center">
                <p className="text-sm text-text-secondary mb-2">
                  Contact your team admin to upgrade
                </p>
                <p className="text-xs text-text-tertiary">
                  Only workspace owners and admins can manage billing
                </p>
              </div>

              {onWaitlist && (
                <button
                  onClick={onWaitlist}
                  className="
                    w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                    text-sm text-brand
                    hover:bg-brand/5 transition-colors
                  "
                >
                  Notify me when I can upgrade
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="
                  w-full py-3 rounded-xl
                  bg-surface-2 text-text-secondary
                  hover:bg-surface-3 transition-colors
                "
              >
                Got it
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>
    </div>
  );
}
