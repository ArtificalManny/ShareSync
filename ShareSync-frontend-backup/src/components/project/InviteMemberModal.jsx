// src/components/project/InviteMemberModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// INVITE MEMBER MODAL — Search users, send invites, manage pending invites
// Behavioral science: "Join my momentum" framing, not "added to a project"
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Search, UserPlus, Mail, Shield, Eye, Users,
  Loader2, Check, Clock, Trash2, ChevronDown,
} from 'lucide-react';
import client from '../../api/client';
import { sendInvite, listInvites, revokeInvite } from '../../api/invites';
import { toast } from '../ui/toast';

const ROLES = [
  { id: 'member', label: 'Member', desc: 'Can create and edit tasks', icon: Users },
  { id: 'viewer', label: 'Viewer', desc: 'Can view but not edit', icon: Eye },
  { id: 'admin', label: 'Admin', desc: 'Full project management', icon: Shield },
];

function timeAgo(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return '';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${dy}d ago`;
}

export default function InviteMemberModal({ projectId, projectName, onClose, onInviteSent }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const searchTimeout = useRef(null);

  // Load existing pending invites
  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    setLoadingInvites(true);
    listInvites(projectId)
      .then(invites => {
        if (mounted) setPendingInvites(invites.filter(i => i.status === 'pending'));
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingInvites(false); });
    return () => { mounted = false; };
  }, [projectId]);

  // Search users as they type
  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await client.get('/users/search', { params: { q: value, limit: 5 } });
        const users = res.data?.data || res.data || [];
        setSearchResults(Array.isArray(users) ? users : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectUser = (user) => {
    setEmail(user.email || user.username || '');
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      await sendInvite(projectId, { email: email.trim(), role });
      toast({ title: `Invite sent to ${email.trim()}`, variant: 'success' });
      setPendingInvites(prev => [...prev, { email: email.trim(), role, status: 'pending', createdAt: new Date().toISOString() }]);
      setEmail('');
      onInviteSent?.();
    } catch (err) {
      toast({ title: err?.response?.data?.message || err?.message || 'Failed to send invite', variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (token) => {
    try {
      await revokeInvite(projectId, token);
      setPendingInvites(prev => prev.filter(i => i.token !== token));
      toast({ title: 'Invite revoked', variant: 'default' });
    } catch {
      toast({ title: 'Failed to revoke', variant: 'error' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const selectedRole = ROLES.find(r => r.id === role) || ROLES[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Invite to {projectName || 'Project'}</h2>
              <p className="text-xs text-slate-500 dark:text-white/40">Invite someone to join your momentum</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4 text-slate-400 dark:text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Email input + role picker */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Email or username
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                  <input
                    type="text"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="name@example.com"
                    autoFocus
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm
                      bg-white dark:bg-white/[0.05]
                      border border-slate-200 dark:border-white/[0.10]
                      text-slate-900 dark:text-white
                      placeholder-slate-400 dark:placeholder-white/30
                      focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
                      transition-shadow"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
                  )}
                </div>

                {/* Role dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowRolePicker(!showRolePicker)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium
                      bg-white dark:bg-white/[0.05]
                      border border-slate-200 dark:border-white/[0.10]
                      text-slate-700 dark:text-white/60
                      hover:bg-slate-50 dark:hover:bg-white/[0.08]
                      transition-colors whitespace-nowrap"
                  >
                    <selectedRole.icon className="w-3.5 h-3.5" />
                    {selectedRole.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showRolePicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowRolePicker(false)} />
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.10] rounded-xl shadow-xl z-20 overflow-hidden">
                        {ROLES.map(r => (
                          <button
                            key={r.id}
                            onClick={() => { setRole(r.id); setShowRolePicker(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                              ${role === r.id ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
                          >
                            <r.icon className={`w-4 h-4 ${role === r.id ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-white/30'}`} />
                            <div>
                              <p className={`text-sm font-medium ${role === r.id ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-white/70'}`}>{r.label}</p>
                              <p className="text-[10px] text-slate-400 dark:text-white/30">{r.desc}</p>
                            </div>
                            {role === r.id && <Check className="w-4 h-4 text-violet-500 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-16 top-full mt-1 bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.10] rounded-xl shadow-xl z-20 overflow-hidden">
                  {searchResults.map(user => (
                    <button
                      key={user._id || user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-sm font-medium text-violet-600 dark:text-violet-400">
                        {(user.firstName || user.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-white/30 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!email.trim() || sending}
            className="w-full py-2.5 rounded-xl text-sm font-medium
              bg-violet-600 hover:bg-violet-700 text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : 'Send Invite'}
          </button>

          {/* Pending invites */}
          {(pendingInvites.length > 0 || loadingInvites) && (
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <h3 className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3">
                Pending Invites
              </h3>

              {loadingInvites ? (
                <div className="flex items-center gap-2 py-4 justify-center text-slate-400 dark:text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingInvites.map((invite, idx) => (
                    <div
                      key={invite.token || idx}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg
                        bg-slate-50 dark:bg-white/[0.03]
                        border border-slate-100 dark:border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 dark:text-white/70 truncate">{invite.email}</p>
                          <p className="text-[10px] text-slate-400 dark:text-white/30">
                            {invite.role} · {timeAgo(invite.createdAt)}
                          </p>
                        </div>
                      </div>

                      {invite.token && (
                        <button
                          onClick={() => handleRevoke(invite.token)}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Revoke invite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
