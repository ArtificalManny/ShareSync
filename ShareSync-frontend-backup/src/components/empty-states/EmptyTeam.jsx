// src/components/empty-states/EmptyTeam.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Empty Team / No Collaborators
// ═══════════════════════════════════════════════════════════════════════════════
//
// Solo work is valid! But collaboration multiplies impact.
// Make inviting feel exciting, not lonely.
//
// Key messaging:
// - "Solo mode active" (positive framing)
// - "Invite collaborators to multiply your impact"
// - Show co-working benefits
// - Easy invite flow
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Sparkles, 
  Zap,
  Mail,
  Link2,
  Copy,
  Check,
  Shield,
  TrendingUp,
  MessageSquare,
  Share2,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { TeamIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// SOLO MODE BADGE
// ═══════════════════════════════════════════════════════════════════════════════
const SoloModeBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20"
    >
      <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
      <span className="text-xs font-medium text-brand-400">Solo Mode Active</span>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLABORATION BENEFITS
// ═══════════════════════════════════════════════════════════════════════════════
const CollaborationBenefits = () => {
  const benefits = [
    { icon: TrendingUp, text: '2.1x productivity boost', color: 'text-success-400' },
    { icon: Zap, text: 'Shared momentum', color: 'text-brand-400' },
    { icon: MessageSquare, text: 'Real-time updates', color: 'text-cyan-400' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap justify-center gap-4 mt-6"
    >
      {benefits.map((benefit, i) => (
        <div 
          key={i}
          className="flex items-center gap-2 text-sm text-text-secondary"
        >
          <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
          <span>{benefit.text}</span>
        </div>
      ))}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE METHODS
// ═══════════════════════════════════════════════════════════════════════════════
const InviteMethods = ({ onInviteByEmail, onCopyLink, inviteLink }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const { glowLevel } = useMomentumContext();
  
  const handleCopyLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        if (onCopyLink) onCopyLink();
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-6"
    >
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        {/* Email invite */}
        {onInviteByEmail && (
          <button
            onClick={onInviteByEmail}
            className={`
              flex items-center justify-center gap-2 px-5 py-3 rounded-xl
              bg-brand-600 text-white
              hover:bg-brand-500
              transition-all duration-200
              ${glowLevel >= 4 ? 'shadow-glow-brand' : ''}
            `}
          >
            <Mail className="w-4 h-4" />
            <span className="font-medium">Invite by Email</span>
          </button>
        )}
        
        {/* Copy link */}
        {inviteLink && (
          <button
            onClick={handleCopyLink}
            className={`
              flex items-center justify-center gap-2 px-5 py-3 rounded-xl
              bg-surface-2 border border-white/[0.06]
              text-text-secondary hover:text-text-primary
              hover:bg-surface-3
              transition-all duration-200
            `}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-success-500" />
                <span className="font-medium text-success-500">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span className="font-medium">Copy Invite Link</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK EMAIL INPUT
// ═══════════════════════════════════════════════════════════════════════════════
const QuickEmailInvite = ({ onSendInvite }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !onSendInvite) return;
    
    setIsSending(true);
    try {
      await onSendInvite(email);
      setSent(true);
      setEmail('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error('Failed to send invite:', err);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 max-w-md mx-auto"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl
              bg-surface-2 border border-white/[0.08]
              text-sm text-text-primary
              placeholder:text-text-tertiary
              focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20
              transition-all duration-200
            "
          />
        </div>
        <button
          type="submit"
          disabled={!email.trim() || isSending}
          className="
            px-4 py-2.5 rounded-xl
            bg-brand-600 text-white text-sm font-medium
            hover:bg-brand-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center gap-2
          "
        >
          {sent ? (
            <>
              <Check className="w-4 h-4" />
              Sent!
            </>
          ) : isSending ? (
            'Sending...'
          ) : (
            'Invite'
          )}
        </button>
      </div>
      
      <p className="text-xs text-text-tertiary mt-2 text-center">
        They'll get an email with a link to join your workspace
      </p>
    </motion.form>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION INFO
// ═══════════════════════════════════════════════════════════════════════════════
const PermissionInfo = ({ permissions = [] }) => {
  const defaultPermissions = [
    { icon: Shield, text: 'You control access levels' },
    { icon: Users, text: 'Invite unlimited teammates' },
  ];
  
  const items = permissions.length > 0 ? permissions : defaultPermissions;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-8 pt-6 border-t border-white/[0.06]"
    >
      <div className="flex justify-center gap-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-text-tertiary">
            <item.icon className="w-3.5 h-3.5" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyTeam({
  // Options
  projectName = '',
  inviteLink = '',
  
  // Actions
  onInviteByEmail,
  onSendInvite,
  onCopyLink,
  
  // Display options
  showBenefits = true,
  showQuickInvite = true,
  showPermissions = true,
  variant = 'illustrated', // 'minimal' | 'illustrated' | 'animated'
  className = '',
}) {
  const { glowLevel, isFireMode } = useMomentumContext();
  
  // Generate contextual title
  const title = projectName 
    ? `You're flying solo on ${projectName}`
    : "Solo mode active";
    
  const description = projectName
    ? `Invite teammates to ${projectName} and multiply your collective impact. Collaboration unlocks shared momentum and faster shipping.`
    : "Great work happens in teams. Invite collaborators to share the journey, multiply your momentum, and ship faster together.";
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-brand-400" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">No teammates yet</p>
        <p className="text-xs text-text-tertiary mb-4">Invite people to collaborate</p>
        {onInviteByEmail && (
          <button
            onClick={onInviteByEmail}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <EmptyState
        illustration={TeamIllustration}
        title={title}
        description={description}
        variant={variant}
        size="default"
        accentColor={isFireMode ? 'energy' : 'brand'}
      >
        {/* Solo mode badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <SoloModeBadge />
        </motion.div>
        
        {/* Benefits */}
        {showBenefits && <CollaborationBenefits />}
        
        {/* Invite methods */}
        <InviteMethods 
          onInviteByEmail={onInviteByEmail}
          onCopyLink={onCopyLink}
          inviteLink={inviteLink}
        />
        
        {/* Quick email input */}
        {showQuickInvite && onSendInvite && (
          <QuickEmailInvite onSendInvite={onSendInvite} />
        )}
        
        {/* Permission info */}
        {showPermissions && <PermissionInfo />}
      </EmptyState>
      
      {/* Inline styles */}
      <style>{`
        .shadow-glow-brand {
          box-shadow: 0 0 20px rgb(139 92 246 / 0.3);
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for sidebars, project cards)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyTeamCompact({ onInvite, memberCount = 0, className = '' }) {
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-center gap-3">
        {/* Avatar stack placeholder */}
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border-2 border-surface-1 flex items-center justify-center">
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-surface-1 border-dashed flex items-center justify-center">
            <span className="text-xs text-text-tertiary">+</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">
            {memberCount > 0 ? `${memberCount} member${memberCount > 1 ? 's' : ''}` : 'Just you'}
          </div>
          <div className="text-xs text-text-tertiary">Invite teammates</div>
        </div>
        
        {onInvite && (
          <button
            onClick={onInvite}
            className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE VARIANT (for headers, toolbars)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyTeamInline({ onInvite, className = '' }) {
  return (
    <button
      onClick={onInvite}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        bg-surface-2 border border-dashed border-white/[0.08]
        hover:border-brand-500/30 hover:bg-surface-3
        text-text-tertiary hover:text-text-secondary
        transition-all duration-200
        ${className}
      `}
    >
      <UserPlus className="w-4 h-4" />
      <span className="text-sm">Invite teammate</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARE PROJECT VARIANT
// ═══════════════════════════════════════════════════════════════════════════════
export function ShareProject({ projectName, inviteLink, onShare, className = '' }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };
  
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-brand-400" />
        <span className="text-sm font-medium text-text-primary">Share {projectName || 'Project'}</span>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-lg bg-surface-2 text-sm text-text-tertiary truncate">
          {inviteLink || 'Generate invite link...'}
        </div>
        <button
          onClick={inviteLink ? handleCopy : onShare}
          className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-500 transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : inviteLink ? (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
}
