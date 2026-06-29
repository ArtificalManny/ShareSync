// src/components/subscription/PricingModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRICING MODAL - Displays plans and handles upgrade/manage subscription
// $39/month Team plan with fair pricing promise
// Renders through a React portal so it is never trapped under Navbar/dropdowns.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Crown,
  Zap,
  Building2,
  Shield,
  Users,
  HardDrive,
  Bot,
  Folder,
} from 'lucide-react';
import {
  createCheckout,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
} from '../../api/subscriptions';
import { toast } from '../ui/toast';

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CONFIGURATION (matches backend PLAN_CONFIGS)
// ═══════════════════════════════════════════════════════════════════════════════

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceYearly: 0,
    period: 'forever',
    description: 'For individuals & small groups',
    icon: Zap,
    iconColor: 'text-slate-500',
    bgGradient: 'from-slate-100 to-slate-200',
    features: [
      { text: 'Up to 10 projects', icon: Folder },
      { text: '5 members per project', icon: Users },
      { text: '1GB storage', icon: HardDrive },
      { text: '100 AI calls/month', icon: Bot },
      { text: 'Community support', icon: Shield },
    ],
  },
  team: {
    name: 'Team',
    price: 39,
    priceYearly: 390,
    period: '/month',
    periodYearly: '/year',
    description: 'For serious teams',
    icon: Crown,
    iconColor: 'text-amber-500',
    bgGradient: 'from-amber-50 to-orange-50',
    popular: true,
    features: [
      { text: 'Up to 50 projects', icon: Folder },
      { text: '25 members per project', icon: Users },
      { text: '10GB storage', icon: HardDrive },
      { text: '1,000 AI calls/month', icon: Bot },
      { text: 'Priority support', icon: Shield },
      { text: 'Org dashboard', icon: Building2 },
      { text: 'Custom branding', icon: Crown },
    ],
    perSeatNote: 'Only ~$1.56/member with full 25 seats',
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    priceYearly: null,
    period: 'Custom',
    description: 'For large organizations',
    icon: Building2,
    iconColor: 'text-violet-500',
    bgGradient: 'from-violet-50 to-fuchsia-50',
    features: [
      { text: 'Unlimited projects', icon: Folder },
      { text: 'Unlimited members', icon: Users },
      { text: '100GB+ storage', icon: HardDrive },
      { text: 'Unlimited AI calls', icon: Bot },
      { text: 'Dedicated support', icon: Shield },
      { text: 'SSO & audit logs', icon: Building2 },
      { text: 'Custom contracts', icon: Crown },
      { text: 'SLA guarantee', icon: Shield },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PricingModal({
  currentPlan = 'free',
  usage,
  limits,
  cancelAt,
  onClose,
  onSuccess,
}) {
  const [activeAction, setActiveAction] = useState(null); // Tracks specific loading state
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'yearly'

  const normalizedPlan = currentPlan || 'free';
  const isPremium = normalizedPlan !== 'free';
  const isCanceling = !!cancelAt;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleUpgrade = async (plan) => {
    if (plan === 'enterprise') {
      window.open(
        'mailto:enterprise@sharesync.app?subject=Enterprise%20Plan%20Inquiry',
        '_blank',
      );
      return;
    }

    setActiveAction(`upgrade_${plan}`);

    try {
      const result = await createCheckout({
        plan,
        interval: billingInterval,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);

      toast({
        title: 'Failed to start checkout',
        description: error.response?.data?.message || 'Please try again',
        variant: 'error',
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleManageBilling = async () => {
    setActiveAction('manage');

    try {
      const result = await createPortalSession();

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);

      toast({
        title: 'Failed to open billing portal',
        description:
          error.response?.data?.message ||
          'Stripe billing portal could not be opened. Please try again.',
        variant: 'error',
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period.",
    );

    if (!confirmed) {
      return;
    }

    setActiveAction('cancel');

    try {
      await cancelSubscription();

      toast({
        title: 'Subscription canceled',
        description: "You'll keep access until the end of your billing period",
        variant: 'success',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to cancel:', error);

      toast({
        title: 'Failed to cancel subscription',
        description:
          error.response?.data?.message ||
          'Please try again from the billing portal.',
        variant: 'error',
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleResume = async () => {
    setActiveAction('resume');

    try {
      await resumeSubscription();

      toast({
        title: 'Subscription resumed',
        variant: 'success',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to resume:', error);

      toast({
        title: 'Failed to resume subscription',
        description:
          error.response?.data?.message ||
          'Please try again from the billing portal.',
        variant: 'error',
      });
    } finally {
      setActiveAction(null);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain">
      {/* Backdrop: click closes only when the actual dark area is clicked */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-colors duration-200 hover:bg-slate-950/60"
        onMouseDown={handleBackdropMouseDown}
        aria-hidden="true"
      />

      {/* Modal positioning layer */}
      <div className="relative z-10 flex min-h-full items-start justify-center p-4 pt-20 pb-10 sm:pt-24 lg:pt-28 pointer-events-none">
        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-modal-title"
          className="pointer-events-auto relative w-full max-w-5xl max-h-[calc(100vh-7rem)] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-950/25"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 z-30 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close pricing modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="pr-10">
                <h2
                  id="pricing-modal-title"
                  className="text-2xl font-bold text-slate-900 mb-2"
                >
                  {isPremium ? 'Manage Your Plan' : 'Choose Your Plan'}
                </h2>

                <p className="text-slate-500 mb-6">
                  Simple, fair pricing. No surprises. Cancel anytime.
                </p>
              </div>

              {/* Active Plan Banner */}
              {isPremium ? (
                <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                        <Crown className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                          Premium active
                        </p>
                        <h3 className="text-lg font-bold text-slate-900">
                          {PLANS[normalizedPlan]?.name || 'Paid Plan'} Plan
                        </h3>
                        <p className="text-sm text-slate-600">
                          Your premium limits are unlocked across the workspace.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleManageBilling}
                      disabled={activeAction === 'manage'}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {activeAction === 'manage' ? 'Opening...' : 'Manage Billing'}
                    </button>
                  </div>

                  {isCanceling && cancelAt && (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-sm text-amber-700">
                      Your plan is scheduled to cancel. Access continues until{' '}
                      {new Date(cancelAt).toLocaleDateString()}.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-8 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
                  <h4 className="font-semibold text-violet-800 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    🤝 Our Fair Pricing Promise
                  </h4>

                  <ul className="text-sm text-violet-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-violet-500" />
                      One flat price per workspace – no per-seat surprises
                    </li>

                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-violet-500" />
                      Set your own monthly max budget
                    </li>

                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-violet-500" />
                      No surprise invoices. Ever.
                    </li>
                  </ul>
                </div>
              )}

              {/* Billing Toggle */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <span
                  className={`text-sm font-medium ${
                    billingInterval === 'monthly'
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  Monthly
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setBillingInterval(
                      billingInterval === 'monthly' ? 'yearly' : 'monthly',
                    )
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    billingInterval === 'yearly'
                      ? 'bg-violet-500'
                      : 'bg-slate-200'
                  }`}
                  aria-label="Toggle billing interval"
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      billingInterval === 'yearly'
                        ? 'translate-x-8'
                        : 'translate-x-1'
                    }`}
                  />
                </button>

                <span
                  className={`text-sm font-medium ${
                    billingInterval === 'yearly'
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  Yearly
                </span>

                {billingInterval === 'yearly' && (
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                    Save 2 months
                  </span>
                )}
              </div>

              {/* Plans Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(PLANS).map(([key, plan]) => (
                  <PlanCard
                    key={key}
                    planKey={key}
                    plan={plan}
                    billingInterval={billingInterval}
                    current={normalizedPlan === key}
                    isCanceling={normalizedPlan === key && isCanceling}
                    cancelAt={cancelAt}
                    onSelect={() => handleUpgrade(key)}
                    onManage={handleManageBilling}
                    onCancel={handleCancel}
                    onResume={handleResume}
                    isUpgrading={activeAction === `upgrade_${key}`}
                    isManaging={activeAction === 'manage'}
                    isCancelingAction={activeAction === 'cancel'}
                    isResuming={activeAction === 'resume'}
                  />
                ))}
              </div>

              {/* Current Usage */}
              {usage && limits && (
                <div className="mt-8 p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Your Current Usage
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <UsageMeter
                      label="Projects"
                      current={usage.projects || 0}
                      limit={limits.projects}
                      icon={Folder}
                    />

                    <UsageMeter
                      label="Storage"
                      current={Math.round(
                        (usage.storageBytes ?? usage.storageUsedBytes ?? usage.storage ?? 0) / 1024 / 1024
                      )}
                      limit={Math.round((limits.storageBytes || 0) / 1024 / 1024)}
                      unit="MB"
                      icon={HardDrive}
                    />

                    <UsageMeter
                      label="AI Calls"
                      current={usage.aiCallsThisMonth || usage.aiCalls || 0}
                      limit={limits.aiCallsPerMonth}
                      icon={Bot}
                    />

                    <UsageMeter
                      label="Members/Project"
                      current={
                        usage.maxMembersInProject ??
                        usage.membersPerProject ??
                        usage.activeMembers ??
                        0
                      }
                      limit={limits.membersPerProject}
                      icon={Users}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CARD
// ═══════════════════════════════════════════════════════════════════════════════

function PlanCard({
  planKey,
  plan,
  billingInterval,
  current,
  isCanceling,
  cancelAt,
  onSelect,
  onManage,
  onCancel,
  onResume,
  isUpgrading,
  isManaging,
  isCancelingAction,
  isResuming,
}) {
  const Icon = plan.icon;
  const isYearly = billingInterval === 'yearly';
  const price = isYearly ? plan.priceYearly : plan.price;
  const period = isYearly ? plan.periodYearly || '/year' : plan.period;
  const isFree = planKey === 'free';
  const isEnterprise = planKey === 'enterprise';

  const anyActionLoading =
    isUpgrading || isManaging || isCancelingAction || isResuming;

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-6 transition-all
        ${
          plan.popular
            ? 'border-violet-500 shadow-lg shadow-violet-100'
            : 'border-slate-200'
        }
        ${
          current
            ? `bg-gradient-to-br ${plan.bgGradient}`
            : 'bg-white hover:border-slate-300'
        }
      `}
    >
      {/* Popular Badge */}
      {plan.popular && !current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 text-white text-xs font-bold rounded-full">
          MOST POPULAR
        </div>
      )}

      {/* Current Badge */}
      {current && !isCanceling && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full">
          CURRENT PLAN
        </div>
      )}

      {/* Canceling Badge */}
      {isCanceling && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
          CANCELING
        </div>
      )}

      {/* Plan Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.bgGradient} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${plan.iconColor}`} />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
          <p className="text-sm text-slate-500">{plan.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        {price !== null ? (
          <>
            <span className="text-3xl font-bold text-slate-800">${price}</span>
            <span className="text-slate-500">{period}</span>

            {plan.perSeatNote && billingInterval === 'monthly' && (
              <p className="text-xs text-teal-600 font-medium mt-1">
                {plan.perSeatNote}
              </p>
            )}
          </>
        ) : (
          <span className="text-2xl font-bold text-slate-800">
            Custom pricing
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, i) => {
          const FeatureIcon = feature.icon;

          return (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <FeatureIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <span>{feature.text}</span>
            </li>
          );
        })}
      </ul>

      {/* Action Button */}
      {current ? (
        <div className="space-y-2">
          <div className="w-full py-3 rounded-xl text-center font-medium bg-white/70 text-slate-700 border border-white/80">
            Current Plan
          </div>

          {!isFree && (
            <>
              <button
                type="button"
                onClick={onManage}
                disabled={anyActionLoading}
                className="w-full py-2 rounded-lg text-sm font-semibold text-violet-700 hover:bg-white/70 transition-colors disabled:opacity-50"
              >
                {isManaging ? 'Loading...' : 'Manage Billing'}
              </button>

              {isCanceling ? (
                <button
                  type="button"
                  onClick={onResume}
                  disabled={anyActionLoading}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-teal-700 hover:bg-white/70 transition-colors disabled:opacity-50"
                >
                  {isResuming ? 'Loading...' : 'Resume Subscription'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={anyActionLoading}
                  className="w-full py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-white/70 transition-colors disabled:opacity-50"
                >
                  {isCancelingAction ? 'Loading...' : 'Cancel Plan'}
                </button>
              )}

              {isCanceling && cancelAt && (
                <p className="text-xs text-amber-600 text-center">
                  Access until {new Date(cancelAt).toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          disabled={anyActionLoading || isFree}
          className={`
            w-full py-3 rounded-xl font-medium transition-all
            ${
              isFree
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : plan.popular
                  ? 'bg-violet-500 text-white hover:bg-violet-600 shadow-md shadow-violet-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
            disabled:opacity-50
          `}
        >
          {isUpgrading
            ? 'Loading...'
            : isEnterprise
              ? 'Contact Sales'
              : isFree
                ? 'Current Plan'
                : 'Upgrade'}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE METER
// ═══════════════════════════════════════════════════════════════════════════════

function UsageMeter({ label, current, limit, unit = '', icon: Icon }) {
  const safeCurrent = Number.isFinite(Number(current)) ? Number(current) : 0;
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 0;
  const isUnlimited = safeLimit === -1;
  const percentage =
    isUnlimited || safeLimit <= 0
      ? 0
      : Math.min((safeCurrent / safeLimit) * 100, 100);
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white rounded-lg p-3 border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>

      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-800 font-semibold">
          {safeCurrent.toLocaleString()}
          {unit}
        </span>

        <span className="text-slate-400">
          / {isUnlimited ? '∞' : `${safeLimit.toLocaleString()}${unit}`}
        </span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? 'bg-amber-500' : 'bg-teal-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
