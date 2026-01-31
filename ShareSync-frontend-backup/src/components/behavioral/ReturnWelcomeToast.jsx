// src/components/behavioral/ReturnWelcomeToast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: "Heartbeat +80 since you left" Welcome Back Toast
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  X, TrendingUp, TrendingDown, Rocket, Users, Zap, 
  PartyPopper, AlertTriangle, Heart
} from 'lucide-react';

export default function ReturnWelcomeToast({
  userName,
  absenceDuration, // in hours
  changes,
  onClose,
  onViewDetails,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 200);
  };

  const formatAbsence = (hours) => {
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  // Determine overall sentiment
  const totalChange = changes?.heartbeat || 0;
  const isPositive = totalChange > 0;

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center p-4
      ${isVisible ? 'opacity-100' : 'opacity-0'}
      transition-opacity duration-300
      ${className}
    `}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-md
        bg-surface-1 border border-white/[0.08] rounded-2xl
        overflow-hidden
        transition-all duration-300
        ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
      `}>
        {/* Top Banner */}
        <div className={`
          p-6 text-center
          ${isPositive 
            ? 'bg-gradient-to-br from-brand/20 to-success/10' 
            : 'bg-gradient-to-br from-surface-2 to-surface-3'
          }
        `}>
          {/* Welcome Icon */}
          <div className="inline-flex p-4 rounded-full bg-surface-1 shadow-lg mb-4">
            {isPositive ? (
              <PartyPopper className="w-8 h-8 text-brand" />
            ) : (
              <Heart className="w-8 h-8 text-brand" />
            )}
          </div>

          <h2 className="text-xl font-semibold text-text-primary mb-1">
            Welcome back, {userName || 'teammate'}!
          </h2>
          <p className="text-sm text-text-tertiary">
            You were away for {formatAbsence(absenceDuration)}
          </p>
        </div>

        {/* Changes Summary */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            While you were away...
          </h3>

          <div className="space-y-3">
            {/* Heartbeat Change */}
            {changes?.heartbeat !== undefined && (
              <ChangeItem
                icon={Heart}
                label="Team Heartbeat"
                value={changes.heartbeat}
                suffix=" ships/week"
                positive={changes.heartbeat > 0}
              />
            )}

            {/* Ships */}
            {changes?.ships > 0 && (
              <ChangeItem
                icon={Rocket}
                label="New Ships"
                value={changes.ships}
                suffix=" deployed"
                positive={true}
              />
            )}

            {/* Team Activity */}
            {changes?.teamActivity && (
              <ChangeItem
                icon={Users}
                label="Team Activity"
                value={changes.teamActivity}
                suffix="%"
                positive={changes.teamActivity > 0}
              />
            )}

            {/* XP Accumulated */}
            {changes?.xpAccumulated > 0 && (
              <ChangeItem
                icon={Zap}
                label="XP Accumulated"
                value={changes.xpAccumulated}
                prefix="+"
                positive={true}
              />
            )}

            {/* Blockers */}
            {changes?.newBlockers > 0 && (
              <ChangeItem
                icon={AlertTriangle}
                label="New Blockers"
                value={changes.newBlockers}
                suffix=" need attention"
                positive={false}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="
                flex-1 py-2.5 rounded-xl
                bg-surface-2 text-text-secondary
                hover:bg-surface-3 transition-colors
              "
            >
              Got it
            </button>
            <button
              onClick={() => {
                onViewDetails?.();
                handleClose();
              }}
              className="
                flex-1 py-2.5 rounded-xl
                bg-brand text-white
                hover:bg-brand-600 transition-colors
              "
            >
              View Details
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>
    </div>
  );
}

function ChangeItem({ icon: Icon, label, value, prefix = '', suffix = '', positive }) {
  const isPositiveValue = positive || value > 0;
  const TrendIcon = isPositiveValue ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2/50">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className={`
        flex items-center gap-1 text-sm font-medium
        ${isPositiveValue ? 'text-success' : 'text-error-500'}
      `}>
        <TrendIcon className="w-3.5 h-3.5" />
        <span>{prefix}{Math.abs(value)}{suffix}</span>
      </div>
    </div>
  );
}
