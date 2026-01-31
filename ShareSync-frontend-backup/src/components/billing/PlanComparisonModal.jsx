// src/components/billing/PlanComparisonModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Plan Comparison Modal
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  X, Check, Minus, Zap, Crown, Building2, Sparkles, Star
} from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';
import { PLAN_TIERS } from '../../api/billing';

const PLAN_ICONS = {
  free: null,
  plus: Zap,
  team: Crown,
  enterprise: Building2,
};

const COMPARISON_FEATURES = [
  { key: 'projects', label: 'Projects', format: (v) => v === -1 ? 'Unlimited' : v },
  { key: 'membersPerProject', label: 'Members per project', format: (v) => v === -1 ? 'Unlimited' : v },
  { key: 'storageGB', label: 'Storage', format: (v) => v === -1 ? 'Unlimited' : `${v} GB` },
  { key: 'aiCredits', label: 'AI Credits/month', format: (v) => v === -1 ? 'Unlimited' : v.toLocaleString() },
  { key: 'historyDays', label: 'History', format: (v) => v === -1 ? 'Unlimited' : `${v} days` },
  { key: 'shipsPerMonth', label: 'Ships/month', format: (v) => v === -1 ? 'Unlimited' : v },
];

const ADDITIONAL_FEATURES = [
  { label: 'Priority support', free: false, plus: true, team: true, enterprise: true },
  { label: 'Advanced analytics', free: false, plus: true, team: true, enterprise: true },
  { label: 'Custom integrations', free: false, plus: false, team: true, enterprise: true },
  { label: 'SSO & SAML', free: false, plus: false, team: true, enterprise: true },
  { label: 'Admin dashboard', free: false, plus: false, team: true, enterprise: true },
  { label: 'Dedicated support', free: false, plus: false, team: false, enterprise: true },
  { label: 'Custom SLA', free: false, plus: false, team: false, enterprise: true },
  { label: 'On-premise option', free: false, plus: false, team: false, enterprise: true },
];

export default function PlanComparisonModal({ isOpen, onClose, onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { planId: currentPlanId } = usePlan();

  if (!isOpen) return null;

  const plans = ['free', 'plus', 'team', 'enterprise'];
  const yearlyDiscount = 0.17; // 2 months free

  const getPrice = (plan) => {
    const tier = PLAN_TIERS[plan];
    if (!tier.price) return 'Contact us';
    if (billingCycle === 'yearly') {
      return `$${Math.round(tier.price * 12 * (1 - yearlyDiscount))}/year`;
    }
    return `$${tier.price}/month`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full max-w-5xl max-h-[90vh] overflow-y-auto
        bg-surface-1 border border-white/[0.08] rounded-2xl
        animate-in zoom-in-95 duration-200
      ">
        {/* Header */}
        <div className="sticky top-0 bg-surface-1 border-b border-white/[0.06] p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Choose Your Plan
              </h2>
              <p className="text-sm text-text-tertiary mt-1">
                Scale as you grow. Upgrade or downgrade anytime.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Billing Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-surface-2">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${billingCycle === 'monthly' 
                      ? 'bg-surface-1 text-text-primary shadow-sm' 
                      : 'text-text-tertiary hover:text-text-secondary'
                    }
                  `}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${billingCycle === 'yearly' 
                      ? 'bg-surface-1 text-text-primary shadow-sm' 
                      : 'text-text-tertiary hover:text-text-secondary'
                    }
                  `}
                >
                  Yearly
                  <span className="ml-1 text-success text-xs">-17%</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {plans.map(planKey => {
              const plan = PLAN_TIERS[planKey];
              const Icon = PLAN_ICONS[planKey];
              const isCurrent = currentPlanId === planKey;
              const isRecommended = planKey === 'plus';

              return (
                <div
                  key={planKey}
                  className={`
                    relative p-5 rounded-xl border transition-all
                    ${isCurrent 
                      ? 'bg-brand/5 border-brand/30' 
                      : isRecommended 
                        ? 'bg-surface-2/50 border-brand/20' 
                        : 'bg-surface-2/30 border-white/[0.06]'
                    }
                  `}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="
                        flex items-center gap-1 px-2 py-0.5 rounded-full
                        bg-brand text-white text-[10px] font-medium
                      ">
                        <Star className="w-3 h-3" />
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    {Icon && (
                      <div className={`inline-flex p-2 rounded-lg ${plan.bg} mb-2`}>
                        <Icon className={`w-5 h-5 ${plan.color}`} />
                      </div>
                    )}
                    <h3 className={`text-lg font-semibold ${plan.color}`}>
                      {plan.name}
                    </h3>
                    <p className="text-2xl font-bold text-text-primary mt-2">
                      {getPrice(planKey)}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => !isCurrent && onSelectPlan?.(planKey, billingCycle)}
                    disabled={isCurrent}
                    className={`
                      w-full py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isCurrent 
                        ? 'bg-surface-3 text-text-tertiary cursor-default' 
                        : planKey === 'enterprise'
                          ? 'bg-surface-2 text-text-primary hover:bg-surface-3 border border-white/[0.1]'
                          : 'bg-brand text-white hover:bg-brand-600'
                      }
                    `}
                  >
                    {isCurrent ? 'Current Plan' : planKey === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 text-sm font-medium text-text-secondary">
                    Features
                  </th>
                  {plans.map(p => (
                    <th key={p} className="text-center py-3 text-sm font-medium text-text-secondary">
                      {PLAN_TIERS[p].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Limit Features */}
                {COMPARISON_FEATURES.map(feature => (
                  <tr key={feature.key} className="border-b border-white/[0.04]">
                    <td className="py-3 text-sm text-text-secondary">{feature.label}</td>
                    {plans.map(p => (
                      <td key={p} className="py-3 text-center text-sm text-text-primary">
                        {feature.format(PLAN_TIERS[p].limits[feature.key])}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Boolean Features */}
                {ADDITIONAL_FEATURES.map(feature => (
                  <tr key={feature.label} className="border-b border-white/[0.04]">
                    <td className="py-3 text-sm text-text-secondary">{feature.label}</td>
                    {plans.map(p => (
                      <td key={p} className="py-3 text-center">
                        {feature[p] ? (
                          <Check className="w-4 h-4 text-success mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-text-tertiary mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
