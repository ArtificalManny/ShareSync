// src/components/members/InviteMember.jsx - Invite new members (Google Drive style)
import React, { useState } from 'react';
import { X, Send, UserPlus, Copy, Check, Mail } from 'lucide-react';
import { toast } from '../ui/toast';
import { enablePublic, disablePublic, regeneratePublicToken } from '../../api/public';

/**
 * InviteMember - Invite new members to project
 * Google Drive-style invite with email/link sharing
 */
const InviteMember = ({ projectId, projectName, onInvite, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [spectatorToken, setSpectatorToken] = useState('');
  const [copiedSpectatorLink, setCopiedSpectatorLink] = useState(false);
  const [spectatorLoading, setSpectatorLoading] = useState(false);

  const inviteLink = `${window.location.origin}/invite/${projectId}`;
  const spectatorLink = spectatorToken
    ? `${window.location.origin}/share/project/${encodeURIComponent(spectatorToken)}`
    : '';

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
      title: '�� Link copied!',
      description: 'Share this link with anyone',
      variant: 'success'
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGenerateSpectatorLink = async () => {
    if (!projectId || spectatorLoading) return;

    setSpectatorLoading(true);
    try {
      const result = await enablePublic(projectId);
      const token = result?.token || result?.publicToken || '';
      setSpectatorToken(token);
      toast({
        title: 'Spectator link ready',
        description: 'Anyone with this link can view a read-only project snapshot.',
        variant: 'success'
      });
    } catch (error) {
      toast({ title: 'Failed to create spectator link', variant: 'error' });
    } finally {
      setSpectatorLoading(false);
    }
  };

  const handleRegenerateSpectatorLink = async () => {
    if (!projectId || spectatorLoading) return;

    setSpectatorLoading(true);
    try {
      const result = await regeneratePublicToken(projectId);
      const token = result?.token || result?.publicToken || '';
      setSpectatorToken(token);
      setCopiedSpectatorLink(false);
      toast({ title: 'Spectator link regenerated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to regenerate spectator link', variant: 'error' });
    } finally {
      setSpectatorLoading(false);
    }
  };

  const handleDisableSpectatorLink = async () => {
    if (!projectId || spectatorLoading) return;

    setSpectatorLoading(true);
    try {
      await disablePublic(projectId);
      setSpectatorToken('');
      setCopiedSpectatorLink(false);
      toast({ title: 'Spectator link disabled', variant: 'warning' });
    } catch (error) {
      toast({ title: 'Failed to disable spectator link', variant: 'error' });
    } finally {
      setSpectatorLoading(false);
    }
  };

  const handleCopySpectatorLink = () => {
    if (!spectatorLink) return;

    navigator.clipboard.writeText(spectatorLink);
    setCopiedSpectatorLink(true);
    toast({
      title: 'Spectator link copied',
      description: 'This link is read-only and does not grant membership.',
      variant: 'success'
    });
    setTimeout(() => setCopiedSpectatorLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-14 backdrop-blur-sm sm:pt-16">
      <div className="relative max-h-[calc(100vh-5.5rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-violet-500/35 bg-slate-950 p-6 shadow-2xl ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        
        {/* Header */}
        <div className="relative z-10 mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-white/15">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Share Access
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
                Invite Members
              </h2>
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
