// src/pages/public/PublicProfile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE PAGE - View any user's public profile
// Phase 8: Replaced mock data with real API calls
// Hardened against legacy demo fallbacks for non-existent usernames
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import {
  User,
  Flame,
  Trophy,
  Target,
  Calendar,
  MapPin,
  Briefcase,
  Globe,
} from 'lucide-react';

const DEFAULT_AVATAR = '/default-profile.png';

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function looksLikeDemoFallbackProfile(data, requestedUsername) {
  const requested = normalizeUsername(requestedUsername);
  if (!requested || requested === 'demo') {
    return false;
  }

  const displayName = normalizeText(
    data?.displayName ||
      data?.name ||
      `${data?.firstName || ''} ${data?.lastName || ''}`.trim()
  );

  const bio = normalizeText(data?.bio);
  const streak = Number(data?.streakDays ?? data?.streak ?? 0);
  const xp = Number(data?.xp ?? data?.points ?? 0);
  const totalShips = Number(data?.totalShips ?? data?.ships ?? 0);

  const hasDemoName = displayName === 'demo user';
  const hasDemoBio = bio === 'building in public. shipping every day.';
  const hasDemoStats = streak === 127 && xp === 15840 && totalShips === 342;

  return hasDemoName || hasDemoBio || hasDemoStats;
}

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const requestedUsername = normalizeUsername(username);

      setLoading(true);
      setError('');
      setProfile(null);
      setProjects([]);

      try {
        const userEndpoints = [
          `/users/public/${encodeURIComponent(username)}`,
          `/users/username/${encodeURIComponent(username)}`,
        ];

        let userData = null;

        for (const url of userEndpoints) {
          try {
            const res = await client.get(url, { signal: controller.signal });
            const data = res?.data?.data || res?.data;

            const returnedUsername = normalizeUsername(
              data?.username || data?.handle || data?.slug
            );

            const hasUserShape = Boolean(
              data && (data._id || data.id || data.username || data.handle || data.slug)
            );

            if (!hasUserShape) {
              continue;
            }

            if (!returnedUsername || returnedUsername !== requestedUsername) {
              continue;
            }

            if (looksLikeDemoFallbackProfile(data, requestedUsername)) {
              continue;
            }

            userData = data;
            break;
          } catch (e) {
            if (e?.name === 'AbortError' || e?.name === 'CanceledError') {
              throw e;
            }
          }
        }

        if (!userData) {
          if (!controller.signal.aborted) {
            setError('This profile is not public or does not exist.');
            setLoading(false);
          }
          return;
        }

        setProfile(userData);

        const userId = userData._id || userData.id;
        if (userId) {
          const projectEndpoints = [
            `/projects?owner=${encodeURIComponent(userId)}&visibility=public`,
            `/projects?ownerId=${encodeURIComponent(userId)}&public=true`,
          ];

          for (const url of projectEndpoints) {
            try {
              const res = await client.get(url, { signal: controller.signal });
              const list = res?.data?.data || res?.data?.projects || res?.data;

              if (Array.isArray(list)) {
                setProjects(
                  list.filter((p) => p.visibility === 'public' || p.publicEnabled)
                );
                break;
              }
            } catch (e) {
              if (e?.name === 'AbortError' || e?.name === 'CanceledError') {
                throw e;
              }
            }
          }
        }
      } catch (e) {
        if (e?.name === 'AbortError' || e?.name === 'CanceledError') {
          return;
        }
        console.error('[PublicProfile] Load error:', e);
        setError('Failed to load profile. Please try again.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (username) {
      loadProfile();
    }

    return () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 dark:text-zinc-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center">
        <p className="text-slate-500 dark:text-zinc-400">No profile data available.</p>
      </div>
    );
  }

  const displayName =
    profile.displayName ||
    profile.name ||
    `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
    profile.username ||
    username;

  const avatarUrl =
    profile.profilePicture || profile.avatarUrl || profile.avatar || DEFAULT_AVATAR;
  const streak = profile.streakDays || profile.streak || 0;
  const totalShips = profile.totalShips || profile.ships || 0;
  const xp = profile.xp || profile.points || 0;
  const level = profile.level || Math.floor(xp / 100) + 1;

  return (
    <div
      className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto"
      style={{
        background:
          'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)',
      }}
    >
      <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-lg shadow-violet-100/50 dark:shadow-none mb-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full p-1"
              style={{
                background:
                  'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)',
              }}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#1f1f23]"
                onError={(e) => {
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
            </div>

            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-xs font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              }}
            >
              Lv {level}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
              {displayName}
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mb-3">
              @{profile.username || username}
            </p>

            {profile.bio && (
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed mb-4">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-zinc-400">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              )}

              {(profile.jobTitle || profile.company) && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {[profile.jobTitle, profile.company].filter(Boolean).join(' at ')}
                </span>
              )}

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-[#111113] rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-800 dark:text-white">
              {streak}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">Day Streak</div>
          </div>

          <div className="bg-slate-50 dark:bg-[#111113] rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Target className="w-5 h-5 text-violet-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-800 dark:text-white">
              {totalShips}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">Ships</div>
          </div>

          <div className="bg-slate-50 dark:bg-[#111113] rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-semibold text-slate-800 dark:text-white">
              {xp.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">XP</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-lg shadow-violet-100/50 dark:shadow-none">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-500" />
          Public Projects
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">
              No public projects yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const projectId = project._id || project.id;

              return (
                <Link
                  key={projectId}
                  to={`/p/${projectId}`}
                  className="block p-4 bg-slate-50 dark:bg-[#111113] rounded-xl border border-slate-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{project.icon || project.emoji || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                        {project.name || project.title || 'Untitled'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
                        {project.description || 'No description'}
                      </p>

                      {project.streakDays > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 dark:text-orange-400">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{project.streakDays} day streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
