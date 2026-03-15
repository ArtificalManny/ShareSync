import React, { useState, useEffect } from 'react';
import { Crown, Zap } from 'lucide-react';
import api from '../../api/client';
import PricingModal from './PricingModal';

export default function SubscriptionButton() {
  const [subscription, setSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/current');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const response = await api.post('/subscriptions/checkout', { plan });
      // Redirect to Stripe Checkout URL provided by your backend
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscription?.plan && subscription.plan !== 'free';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isPremium
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/20 hover:shadow-md hover:-translate-y-0.5'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-violet-600 shadow-sm'
        }`}
      >
        {isPremium ? (
          <>
            <Crown className="w-4 h-4" />
            <span>{subscription.plan === 'team' ? 'Team' : 'Enterprise'}</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 text-violet-500" />
            <span>Upgrade</span>
          </>
        )}
      </button>

      {showModal && (
        <PricingModal
          currentPlan={subscription?.plan || 'free'}
          usage={subscription?.usage}
          limits={subscription?.limits}
          onUpgrade={handleUpgrade}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </>
  );
}
