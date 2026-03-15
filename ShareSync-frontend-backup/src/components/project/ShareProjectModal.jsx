// src/components/project/ShareProjectModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARE PROJECT MODAL — Copy link, toggle visibility, show followers
// Behavioral science: sharing shows momentum stats (the share itself is a flex)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  X, Link2, Copy, Check, Globe, Lock, Eye,
  Users, TrendingUp, Zap, Flame,
} from 'lucide-react';
import client from '../../api/client';
import { toast } from '../ui/toast';

export default function ShareProjectModal({ project, projectId, onClose, onVisibilityChanged }) {
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState(project?.visibility || 'private');
  const [saving, setSaving] = useState(false);
  const [followerCount, setFollowerCount] = useState(project?.followersCount || 0);

  const projectUrl = `${window.location.origin}/projects/${projectId}`;
  const isPublic = visibility === 'public' || visibility === 'listed';

  // Fetch follow status for count
  useEffect(() => {
    if (!projectId) return;
    client.get(`/projects/${projectId}/follow-status`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (typeof data?.followersCount === 'number') setFollowerCount(data.followersCount);
      })
      .catch(() => {});
  }, [projectId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      toast({ title: 'Link copied!', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = projectUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVisibilityToggle = async () => {
    const newVisibility = isPublic ? 'private' : 'public';
    setSaving(true);
    try {
      await client.put(`/projects/${projectId}`, {
        visibility: newVisibility,
        settings: {
          isPublic: newVisibility === 'public',
          isListed: newVisibility === 'public',
        },
      });
      setVisibility(newVisibility);
      toast({
        title: newVisibility === 'public' ? 'Project is now public' : 'Project is now private',
        variant: 'success',
      });
      onVisibilityChanged?.(newVisibility);
    } catch (err) {
      toast({ title: err?.response?.data?.message || 'Failed to update visibility', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const momentum = project?.metrics?.momentum || 0;
  const weeklyShips = project?.metrics?.weeklyShips || 0;
  const streak = project?.streakDays || 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <Link2 className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Share Project</h2>
              <p className="text-xs text-slate-500 dark:text-white/40">Let others follow your momentum</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4 text-slate-400 dark:text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Momentum preview card — the "flex" */}
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-100 dark:border-violet-500/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{
                  backgroundColor: (project?.color || '#7C3AED') + '20',
                }}
              >
                {project?.emoji || project?.icon || '📁'}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{project?.name || 'Project'}</h3>
                <p className="text-[11px] text-slate-500 dark:text-white/40">
                  {isPublic ? 'Public project' : 'Private project'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-medium">{momentum} momentum</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{weeklyShips} ships/week</span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{streak}d streak</span>
                </div>
              )}
            </div>

            {followerCount > 0 && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-white/40">
                <Eye className="w-3.5 h-3.5" />
                <span>{followerCount} spectator{followerCount !== 1 ? 's' : ''} watching</span>
              </div>
            )}
          </div>

          {/* Copy link */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider mb-2 block">
              Project Link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl text-sm
                bg-slate-50 dark:bg-white/[0.05]
                border border-slate-200 dark:border-white/[0.08]
                text-slate-600 dark:text-white/50 truncate select-all"
              >
                {projectUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-sm'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-500 dark:text-white/40" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  {isPublic ? 'Public' : 'Private'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-white/40">
                  {isPublic
                    ? 'Anyone can find and follow this project'
                    : 'Only invited members can access'}
                </p>
              </div>
            </div>

            <button
              onClick={handleVisibilityToggle}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
              } ${saving ? 'opacity-50' : ''}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isPublic ? 'left-[22px]' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Info text */}
          <p className="text-[11px] text-slate-400 dark:text-white/30 text-center">
            {isPublic
              ? 'Public projects appear in Discover and can be followed by anyone.'
              : 'Make your project public to let spectators follow your progress.'}
          </p>
        </div>
      </div>
    </div>
  );
}
