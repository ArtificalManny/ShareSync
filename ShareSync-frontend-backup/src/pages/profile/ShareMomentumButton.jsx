// src/components/profile/ShareMomentumButton.jsx - Week 9 Day 3-4
import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import MomentumCard from '../share/MomentumCard';

/**
 * ShareMomentumButton - Button to share momentum card
 * Can be used on profile page or anywhere
 */
const ShareMomentumButton = ({ user, compact = false }) => {
  const [showCard, setShowCard] = useState(false);

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowCard(true)}
          className="p-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-lg transition-all"
          title="Share my momentum"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {showCard && (
          <MomentumCard
            user={user}
            onClose={() => setShowCard(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg"
      >
        <Share2 className="w-5 h-5" />
        Share My Momentum
      </button>

      {showCard && (
        <MomentumCard
          user={user}
          onClose={() => setShowCard(false)}
        />
      )}
    </>
  );
};

export default ShareMomentumButton;