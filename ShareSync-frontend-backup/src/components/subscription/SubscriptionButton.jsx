// src/components/subscription/SubscriptionButton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION BUTTON - Shows current plan + opens pricing modal
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles } from 'lucide-react';
import { getCurrentSubscription } from '../../api/subscriptions';
import PricingModal from './PricingModal';

export default function SubscriptionButton({ className = '' }) {
  const [subscription, setSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const isPremium = subscription?.plan && subscription.plan !== 'free';
  const isTeam = subscription?.plan === 'team';
  const isEnterprise = subscription?.plan === 'enterprise';

  if (loading) {
    return (
      <div className={`px-3 py-1.5 rounded-lg bg-slate-100 animate-pulse ${className}`}>
        <div className="w-16 h-4" />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200 hover:scale-105 active:scale-95
          ${isPremium
            ? isEnterprise
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200'
              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
          ${className}
        `}
      >
        {isEnterprise ? (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Enterprise</span>
          </>
        ) : isTeam ? (
          <>
            <Crown className="w-4 h-4" />
            <span>Team</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>Upgrade</span>
          </>
        )}
      </button>

      {/* Pricing Modal */}
      {showModal && (
        <PricingModal
          currentPlan={subscription?.plan || 'free'}
          usage={subscription?.usage}
          limits={subscription?.limits}
          cancelAt={subscription?.cancelAt}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadSubscription();
          }}
        />
      )}
    </>
  );
}
