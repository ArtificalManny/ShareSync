// src/components/settings/BillingSettings.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// BILLING SETTINGS - Subscription management in Settings page
// FIXED: PricingModal import to use default export. Removed redundant h2 for nesting.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { CreditCard, Crown, Zap, ExternalLink, AlertCircle } from 'lucide-react';
import { getCurrentSubscription, createPortalSession } from '../../api/subscriptions';
import PricingModal from '../subscription/PricingModal';

export default function BillingSettings() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  const isPremium = subscription?.plan && subscription.plan !== 'free';
  const isCanceling = !!subscription?.cancelAt;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-24 bg-slate-200 dark:bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className={`rounded-xl border p-5 ${
        isPremium
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200 dark:border-amber-500/30'
          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPremium
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-slate-200 dark:bg-zinc-800'
            }`}>
              {isPremium ? (
                <Crown className="w-5 h-5 text-white" />
              ) : (
                <Zap className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                {subscription?.plan === 'team' ? 'Team Plan' :
                 subscription?.plan === 'enterprise' ? 'Enterprise Plan' :
                 'Free Plan'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {isPremium
                  ? `$${subscription.plan === 'team' ? '39' : 'Custom'}/month`
                  : 'Forever free'}
              </p>
            </div>
          </div>

          {!isPremium && (
            <button
              type="button"
              onClick={() => setShowPricing(true)}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>

        {/* Billing Period */}
        {isPremium && subscription.currentPeriodEnd && (
          <div className="text-sm text-slate-600 dark:text-zinc-400">
            {isCanceling ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Access until {new Date(subscription.cancelAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <span>
                Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      {subscription?.usage && subscription?.limits && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UsageStat
            label="Projects"
            current={subscription.usage.projects || 0}
            limit={subscription.limits.projects}
          />
          <UsageStat
            label="Storage"
            current={Math.round((subscription.usage.storage || 0) / 1024 / 1024)}
            limit={Math.round((subscription.limits.storageBytes || 0) / 1024 / 1024)}
            unit="MB"
          />
          <UsageStat
            label="AI Calls"
            current={subscription.usage.aiCallsThisMonth || 0}
            limit={subscription.limits.aiCallsPerMonth}
          />
          <UsageStat
            label="Members/Project"
            current={5}
            limit={subscription.limits.membersPerProject}
          />
        </div>
      )}

      {/* Manage Billing Button */}
      {isPremium && (
        <button
          type="button"
          onClick={handleManageBilling}
          disabled={portalLoading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          <span>{portalLoading ? 'Loading...' : 'Manage Billing'}</span>
          <ExternalLink className="w-4 h-4 ml-auto" />
        </button>
      )}

      {/* Pricing Modal */}
      {showPricing && (
        <PricingModal
          currentPlan={subscription?.plan || 'free'}
          usage={subscription?.usage}
          limits={subscription?.limits}
          cancelAt={subscription?.cancelAt}
          onClose={() => setShowPricing(false)}
          onSuccess={() => {
            setShowPricing(false);
            loadSubscription();
          }}
        />
      )}
    </div>
  );
}

function UsageStat({ label, current, limit, unit = '' }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-800 dark:text-white">
        {current.toLocaleString()}{unit}
        <span className="text-sm font-normal text-slate-400 dark:text-zinc-500">
          {' '}/ {isUnlimited ? '∞' : `${limit.toLocaleString()}${unit}`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
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
