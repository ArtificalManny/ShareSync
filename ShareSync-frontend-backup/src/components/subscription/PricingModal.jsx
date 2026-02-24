// src/components/subscription/PricingModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRICING MODAL - Displays plans and handles upgrade/manage subscription
// $39/month Team plan with fair pricing promise
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { X, Check, Crown, Zap, Building2, Shield, Users, HardDrive, Bot, Folder } from 'lucide-react';
import { createCheckout, createPortalSession, cancelSubscription, resumeSubscription } from '../../api/subscriptions';
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
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'yearly'

  const handleUpgrade = async (plan) => {
    if (plan === 'enterprise') {
      window.open('mailto:enterprise@sharesync.app?subject=Enterprise%20Plan%20Inquiry', '_blank');
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const result = await createPortalSession();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast({
        title: 'Failed to open billing portal',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep access until the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      await cancelSubscription();
      toast({
        title: 'Subscription canceled',
        description: 'You\'ll keep access until the end of your billing period',
        variant: 'success',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to cancel:', error);
      toast({
        title: 'Failed to cancel subscription',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
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
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const isPremium = currentPlan !== 'free';
  const isCanceling = !!cancelAt;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:pt-32">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[75vh] sm:max-h-[80vh] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="p-8">
          {/* Header */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Choose Your Plan
          </h2>
          <p className="text-slate-500 mb-6">
            Simple, fair pricing. No surprises. Cancel anytime.
          </p>

          {/* Fair Pricing Promise */}
          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-4 mb-8">
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

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-slate-800' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingInterval === 'yearly' ? 'bg-violet-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  billingInterval === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-slate-800' : 'text-slate-400'}`}>
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
                current={currentPlan === key}
                isCanceling={currentPlan === key && isCanceling}
                cancelAt={cancelAt}
                onSelect={() => handleUpgrade(key)}
                onManage={handleManageBilling}
                onCancel={handleCancel}
                onResume={handleResume}
                loading={loading}
              />
            ))}
          </div>

          {/* Current Usage */}
          {usage && limits && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">Your Current Usage</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <UsageMeter
                  label="Projects"
                  current={usage.projects || 0}
                  limit={limits.projects}
                  icon={Folder}
                />
                <UsageMeter
                  label="Storage"
                  current={Math.round((usage.storage || 0) / 1024 / 1024)}
                  limit={Math.round((limits.storageBytes || 0) / 1024 / 1024)}
                  unit="MB"
                  icon={HardDrive}
                />
                <UsageMeter
                  label="AI Calls"
                  current={usage.aiCallsThisMonth || 0}
                  limit={limits.aiCallsPerMonth}
                  icon={Bot}
                />
                <UsageMeter
                  label="Members/Project"
                  current={5} // Example - would come from actual data
                  limit={limits.membersPerProject}
                  icon={Users}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  loading,
}) {
  const Icon = plan.icon;
  const isYearly = billingInterval === 'yearly';
  const price = isYearly ? plan.priceYearly : plan.price;
  const period = isYearly ? plan.periodYearly || '/year' : plan.period;
  const isFree = planKey === 'free';
  const isEnterprise = planKey === 'enterprise';

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-6 transition-all
        ${plan.popular ? 'border-violet-500 shadow-lg shadow-violet-100' : 'border-slate-200'}
        ${current ? `bg-gradient-to-br ${plan.bgGradient}` : 'bg-white hover:border-slate-300'}
      `}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 text-white text-xs font-bold rounded-full">
          MOST POPULAR
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
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.bgGradient} flex items-center justify-center`}>
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
            <span className="text-3xl font-bold text-slate-800">
              ${price}
            </span>
            <span className="text-slate-500">{period}</span>
            {plan.perSeatNote && billingInterval === 'monthly' && (
              <p className="text-xs text-teal-600 font-medium mt-1">
                {plan.perSeatNote}
              </p>
            )}
          </>
        ) : (
          <span className="text-2xl font-bold text-slate-800">Custom pricing</span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, i) => {
          const FeatureIcon = feature.icon;
          return (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <FeatureIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <span>{feature.text}</span>
            </li>
          );
        })}
      </ul>

      {/* Action Button */}
      {current ? (
        <div className="space-y-2">
          <div className="w-full py-3 rounded-xl text-center font-medium bg-slate-100 text-slate-500">
            Current Plan
          </div>
          {!isFree && (
            <>
              <button
                onClick={onManage}
                disabled={loading}
                className="w-full py-2 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"
              >
                Manage Billing
              </button>
              {isCanceling ? (
                <button
                  onClick={onResume}
                  disabled={loading}
                  className="w-full py-2 rounded-lg text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
                >
                  Resume Subscription
                </button>
              ) : (
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Cancel Plan
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
          onClick={onSelect}
          disabled={loading || isFree}
          className={`
            w-full py-3 rounded-xl font-medium transition-all
            ${isFree
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : plan.popular
                ? 'bg-violet-500 text-white hover:bg-violet-600 shadow-md shadow-violet-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
            disabled:opacity-50
          `}
        >
          {loading ? 'Loading...' : isEnterprise ? 'Contact Sales' : isFree ? 'Current Plan' : 'Upgrade'}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE METER
// ═══════════════════════════════════════════════════════════════════════════════

function UsageMeter({ label, current, limit, unit = '', icon: Icon }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white rounded-lg p-3 border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-800 font-semibold">
          {current.toLocaleString()}{unit}
        </span>
        <span className="text-slate-400">
          / {isUnlimited ? '∞' : `${limit.toLocaleString()}${unit}`}
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
