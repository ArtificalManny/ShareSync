// src/components/billing/PlanOverviewPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Plan Overview Side Panel
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  X, Crown, Check, Zap, ExternalLink, CreditCard, Calendar
} from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';
import { UsagePanel } from './UsageCapacityBar';
import { PLAN_TIERS } from '../../api/billing';

export default function PlanOverviewPanel({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  onManageBilling 
}) {
  const { plan, planId, canManageBilling, isFree } = usePlan();

  if (!isOpen) return null;

  const currentPlan = plan || PLAN_TIERS.free;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="
        fixed top-0 right-0 h-full w-full max-w-md z-50
        bg-surface-1 border-l border-white/[0.06]
        overflow-y-auto
        animate-in slide-in-from-right duration-300
      ">
        {/* Header */}
        <div className="sticky top-0 bg-surface-1 border-b border-white/[0.06] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentPlan.bg}`}>
                <Crown className={`w-5 h-5 ${currentPlan.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {currentPlan.name} Plan
                </h2>
                <p className="text-sm text-text-tertiary">
                  {isFree ? 'Free forever' : `$${currentPlan.price}/month`}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <X className="w-5 h-5 text-text-tertiary" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Usage Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-4">
              Current Usage
            </h3>
            <UsagePanel />
          </section>

          {/* Features Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-4">
              Included Features
            </h3>
            <div className="space-y-2">
              {currentPlan.features?.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${currentPlan.color}`} />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Upgrade CTA */}
          {isFree && (
            <section className="p-4 rounded-xl bg-brand/5 border border-brand/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-brand/10">
                  <Zap className="w-5 h-5 text-brand" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-text-primary mb-1">
                    Upgrade to Plus
                  </h4>
                  <p className="text-xs text-text-tertiary mb-3">
                    Unlock unlimited projects, 10× more AI credits, and 1-year history
                  </p>
                  <button
                    onClick={onUpgrade}
                    className="
                      w-full py-2.5 rounded-lg
                      bg-brand text-white text-sm font-medium
                      hover:bg-brand-600 transition-colors
                    "
                  >
                    Upgrade for $12/month
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Billing Management */}
          {canManageBilling && !isFree && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-text-secondary">
                Billing
              </h3>
              
              <button
                onClick={onManageBilling}
                className="
                  w-full flex items-center justify-between p-4 rounded-xl
                  bg-surface-2/50 border border-white/[0.06]
                  hover:bg-surface-2 transition-colors
                "
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">Payment method</span>
                </div>
                <ExternalLink className="w-4 h-4 text-text-tertiary" />
              </button>

              <button className="
                w-full flex items-center justify-between p-4 rounded-xl
                bg-surface-2/50 border border-white/[0.06]
                hover:bg-surface-2 transition-colors
              ">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">Billing history</span>
                </div>
                <ExternalLink className="w-4 h-4 text-text-tertiary" />
              </button>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
