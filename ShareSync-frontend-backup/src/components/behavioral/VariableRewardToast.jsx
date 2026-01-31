// src/components/behavioral/VariableRewardToast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: Random Bonus Moments Toast
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { getRewardColor, getRewardBg, calculateRewardXp } from '../../utils/variableRewards';

export default function VariableRewardToast({
  reward,
  onClose,
  onClaim,
  autoDismiss = 5000,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);

    // Auto dismiss
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 200);
  };

  const handleClaim = () => {
    setIsClaimed(true);
    onClaim?.(reward);
    setTimeout(() => handleClose(), 800);
  };

  if (!reward) return null;

  const colorClass = getRewardColor(reward.rarity);
  const bgClass = getRewardBg(reward.rarity);
  const xpValue = calculateRewardXp(reward);

  const rarityLabels = {
    common: '',
    uncommon: 'UNCOMMON',
    rare: 'RARE',
    epic: 'EPIC',
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        ${className}
      `}
    >
      <div className={`
        relative p-4 rounded-2xl border shadow-2xl
        ${bgClass} 
        ${reward.rarity === 'epic' ? 'border-warning/30' : 
          reward.rarity === 'rare' ? 'border-cyan-400/30' : 
          'border-white/[0.1]'}
        min-w-[280px] max-w-[320px]
      `}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>

        {/* Sparkle effect for rare+ */}
        {(reward.rarity === 'rare' || reward.rarity === 'epic') && (
          <div className="absolute -top-2 -right-2">
            <Sparkles className={`w-6 h-6 ${colorClass} animate-pulse`} />
          </div>
        )}

        {/* Content */}
        <div className="text-center">
          {/* Rarity label */}
          {rarityLabels[reward.rarity] && (
            <div className={`text-[10px] font-bold tracking-widest ${colorClass} mb-1`}>
              {rarityLabels[reward.rarity]} DROP
            </div>
          )}

          {/* Emoji */}
          <div className="text-4xl mb-2">{reward.emoji}</div>

          {/* Message */}
          <p className="text-lg font-semibold text-text-primary mb-1">
            {reward.message}
          </p>

          {/* XP value */}
          <p className="text-sm text-text-secondary mb-4">
            +{xpValue} XP
          </p>

          {/* Claim button */}
          {!isClaimed ? (
            <button
              onClick={handleClaim}
              className={`
                w-full py-2.5 rounded-xl font-medium text-white
                transition-all
                ${reward.rarity === 'epic' 
                  ? 'bg-gradient-to-r from-warning to-orange-500 hover:from-warning/90 hover:to-orange-500/90' 
                  : reward.rarity === 'rare'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-500/90 hover:to-blue-500/90'
                    : 'bg-brand hover:bg-brand-600'
                }
              `}
            >
              Claim Reward
            </button>
          ) : (
            <div className="py-2.5 text-center">
              <span className="text-success font-medium">✓ Claimed!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Mini notification version for less intrusive rewards
 */
export function MiniRewardNotification({ reward, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 200);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!reward) return null;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      transition-all duration-300
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
    `}>
      <div className="
        flex items-center gap-3 px-4 py-2.5 rounded-xl
        bg-surface-1 border border-white/[0.1] shadow-lg
      ">
        <span className="text-xl">{reward.emoji}</span>
        <span className="text-sm font-medium text-text-primary">{reward.message}</span>
      </div>
    </div>
  );
}
