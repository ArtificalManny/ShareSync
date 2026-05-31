// src/components/members/InviteMember.jsx - Invite new members (Google Drive style)
import React, { useState } from 'react';
import { X, Send, UserPlus, Copy, Check, Mail } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * InviteMember - Invite new members to project
 * Google Drive-style invite with email/link sharing
 */
const InviteMember = ({ projectId, projectName, onInvite, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = `${window.location.origin}/invite/${projectId}`;

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({ title: 'Enter an email address', variant: 'error' });
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      toast({ title: 'Invalid email address', variant: 'error' });
      return;
    }

    setInviting(true);
    try {
      await onInvite?.({ email, role });
      toast({ 
        title: '📧 Invitation sent!', 
        description: `${email} will receive an email invite`,
        variant: 'success' 
      });
      setEmail('');
    } catch (error) {
      toast({ title: 'Failed to send invitation', variant: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast({ 
      title: '🔗 Link copied!', 
      description: 'Share this link with anyone',
      variant: 'success' 
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Invite Members</h2>
              <p className="text-sm text-slate-400">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Email Invite */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Invite by Email</label>
          
          <div className="flex gap-3 mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInvite();
                }
              }}
            />
            <button
              onClick={handleInvite}
              disabled={!email.trim() || inviting}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {inviting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Invite
                </>
              )}
            </button>
          </div>

          {/* Role Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setRole('member')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                role === 'member'
                  ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Member
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Admin
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {role === 'admin' ? 'Admins can manage project settings' : 'Members can view and contribute'}
          </p>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-900 text-slate-400">Or share link</span>
          </div>
        </div>

        {/* Link Sharing */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Share Invite Link</label>
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm overflow-x-auto whitespace-nowrap">
              {inviteLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Anyone with this link can request to join
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex gap-3">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Email invites are instant</p>
              <p className="text-blue-300/80">Recipients will get an email with a join link and can access immediately after accepting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMember;
