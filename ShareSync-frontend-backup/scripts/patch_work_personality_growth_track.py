from pathlib import Path
import sys

ROOT = Path.cwd()
WORK_PERSONALITY = ROOT / "src/components/analytics/WorkPersonality.jsx"

WORK_PERSONALITY_CODE = """// src/components/analytics/WorkPersonality.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Work Personality
// Powered by Growth Track skill profile data from /analytics/growth/:userId/skills
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Clock, TrendingUp, ShieldCheck } from 'lucide-react';
import { getSkillProfile } from '../../api/growthTrack';
import '../../styles/card.css';

const DEFAULT_SKILLS = {
  velocity: 0,
  quality: 0,
  collaboration: 0,
  reliability: 0,
};

function clampScore(value) {
  const next = Number(value || 0);

  if (!Number.isFinite(next)) return 0;

  return Math.max(0, Math.min(100, Math.round(next)));
}

function normalizeSkillProfile(profile) {
  if (!profile) return null;

  const skills = {
    ...DEFAULT_SKILLS,
    ...(profile.skills || {}),
  };

  return {
    ...profile,
    skills: {
      velocity: clampScore(skills.velocity),
      quality: clampScore(skills.quality),
      collaboration: clampScore(skills.collaboration),
      reliability: clampScore(skills.reliability),
    },
    strengths: Array.isArray(profile.strengths) ? profile.strengths : [],
    growthAreas: Array.isArray(profile.growthAreas) ? profile.growthAreas : [],
    archetype: profile.archetype || { current: 'The Strategist' },
  };
}

export default function WorkPersonality({ userId, profile: profileProp = null }) {
  const [profile, setProfile] = useState(() => normalizeSkillProfile(profileProp));
  const [loading, setLoading] = useState(Boolean(userId) && !profileProp);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      if (!userId || profileProp) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getSkillProfile(userId);

        if (active) {
          setProfile(normalizeSkillProfile(data));
        }
      } catch (err) {
        console.error('[WorkPersonality] Error:', err);

        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [userId, profileProp]);

  useEffect(() => {
    if (profileProp) {
      setProfile(normalizeSkillProfile(profileProp));
    }
  }, [profileProp]);

  const model = useMemo(() => {
    if (!profile) return null;

    const skills = profile.skills || DEFAULT_SKILLS;
    const collaborationStyle = getCollaborationStyle(skills);
    const reliabilityScore = clampScore(skills.reliability);
    const primaryRole = getPrimaryRole(skills, profile);
    const hotZone = getHotZone(skills, profile);

    return {
      skills,
      collaborationStyle,
      reliabilityScore,
      primaryRole,
      hotZone,
      identity: getIdentityStatement(collaborationStyle, primaryRole, reliabilityScore),
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="card-base card-padding rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1a1a1c]">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 rounded-2xl bg-slate-100 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="card-base card-padding rounded-3xl border border-dashed border-slate-300 bg-white/70 text-sm text-slate-500 dark:border-white/[0.14] dark:bg-white/[0.04] dark:text-zinc-400">
        Behavioral analysis will appear once OpenShare has enough profile activity to evaluate.
      </div>
    );
  }

  const { collaborationStyle, reliabilityScore, primaryRole, hotZone, identity } = model;

  return (
    <motion.div
      className="card-base card-padding rounded-3xl border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-900/5 dark:border-white/[0.08] dark:bg-[#1a1a1c]/95 dark:shadow-black/30 space-y-6"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600 dark:text-violet-300" />
            <h3 className="text-xl font-black tracking-tight text-violet-700 dark:text-violet-300">
              Your Work Personality
            </h3>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-500">
            Derived from velocity, quality, collaboration, and reliability signals.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400">
          Last 30 days
        </span>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Work personality data is temporarily unavailable. The profile will keep using the latest available signals.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PersonalityCard
          icon={<Brain className="h-5 w-5" />}
          label="Collaboration Style"
          value={collaborationStyle.type}
          description={collaborationStyle.description}
          color="blue"
        />

        <PersonalityCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Reliability Score"
          value={`${reliabilityScore}/100`}
          description={getReliabilityMessage(reliabilityScore)}
          color="green"
        />

        <PersonalityCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Primary Role"
          value={primaryRole.type}
          description={primaryRole.description}
          color="purple"
        />

        <PersonalityCard
          icon={<Clock className="h-5 w-5" />}
          label="Peak Performance"
          value={hotZone.time}
          description={hotZone.description}
          color="orange"
        />
      </div>

      <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-fuchsia-500/10">
        <p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
          <strong className="text-violet-700 dark:text-violet-300">You are becoming:</strong>{' '}
          {identity}
        </p>
      </div>
    </motion.div>
  );
}

function PersonalityCard({ icon, label, value, description, color }) {
  const colorClasses = {
    blue: {
      card: 'bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300',
      icon: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    },
    green: {
      card: 'bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300',
      icon: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    purple: {
      card: 'bg-violet-50/80 border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-300',
      icon: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    },
    orange: {
      card: 'bg-orange-50/80 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-300',
      icon: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    },
  };

  const palette = colorClasses[color] || colorClasses.purple;

  return (
    <div className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm ${palette.card}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${palette.icon}`}>
          {icon}
        </span>
        <span className="text-xs font-black uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>

      <div className="mb-1 text-2xl font-black tracking-tight">
        {value}
      </div>

      <div className="text-xs leading-5 opacity-80">
        {description}
      </div>
    </div>
  );
}

function getCollaborationStyle(skills) {
  const collaboration = clampScore(skills.collaboration);
  const velocity = clampScore(skills.velocity);

  if (collaboration >= 76) {
    return {
      type: 'Collaboration Catalyst',
      description: 'Creates momentum through shared work and team interaction',
    };
  }

  if (collaboration >= 51) {
    return {
      type: 'Team Operator',
      description: 'Works effectively across teammates and shared objectives',
    };
  }

  if (collaboration >= 21) {
    return {
      type: 'Balanced Contributor',
      description: 'Contributes independently while staying connected to the team',
    };
  }

  if (velocity >= 70) {
    return {
      type: 'Independent Shipper',
      description: 'Moves work forward with limited collaboration signals so far',
    };
  }

  return {
    type: 'Independent Builder',
    description: 'Building a collaboration profile as more shared work is captured',
  };
}

function getPrimaryRole(skills, profile) {
  const velocity = clampScore(skills.velocity);
  const quality = clampScore(skills.quality);
  const collaboration = clampScore(skills.collaboration);
  const reliability = clampScore(skills.reliability);
  const archetype = profile?.archetype?.current;

  if (archetype && archetype !== 'The Explorer') {
    return {
      type: archetype,
      description: 'Primary role inferred from your current growth profile',
    };
  }

  if (velocity >= 80 && quality >= 60) {
    return {
      type: 'The Shipper',
      description: 'Turns plans into completed work with strong execution',
    };
  }

  if (quality >= 75) {
    return {
      type: 'The Strategist',
      description: 'Balances judgment, priority, and execution quality',
    };
  }

  if (collaboration >= 60) {
    return {
      type: 'The Coordinator',
      description: 'Creates value by connecting people and moving shared work',
    };
  }

  if (reliability >= 75) {
    return {
      type: 'The Operator',
      description: 'Builds trust through dependable follow-through',
    };
  }

  return {
    type: 'The Strategist',
    description: 'Balances planning and execution',
  };
}

function getHotZone(skills, profile) {
  const velocity = clampScore(skills.velocity);
  const quality = clampScore(skills.quality);
  const collaboration = clampScore(skills.collaboration);
  const reliability = clampScore(skills.reliability);

  if (velocity >= 85) {
    return {
      time: 'Flow State',
      description: 'Your execution pace is currently the strongest signal',
    };
  }

  if (quality >= 80) {
    return {
      time: 'Precision Mode',
      description: 'Your strongest signal is careful, high-impact completion',
    };
  }

  if (collaboration >= 70) {
    return {
      time: 'Team Sync',
      description: 'Your strongest signal is shared-work momentum',
    };
  }

  if (reliability >= 70) {
    return {
      time: 'Reliable Rhythm',
      description: 'Your strongest signal is dependable follow-through',
    };
  }

  if (profile?.strengths?.length > 0) {
    return {
      time: `${profile.strengths[0]} rising`,
      description: 'A measurable strength is beginning to separate from the baseline',
    };
  }

  return {
    time: 'Building data...',
    description: 'Keep shipping to reveal stronger patterns',
  };
}

function getReliabilityMessage(score) {
  if (score >= 90) return 'Extremely dependable';
  if (score >= 75) return 'Very reliable';
  if (score >= 60) return 'Generally on-track';
  if (score >= 40) return 'Developing consistency';
  if (score > 0) return 'Early reliability signal';
  return 'Building track record';
}

function getIdentityStatement(collab, role, reliabilityScore) {
  const statements = {
    'Collaboration Catalyst': 'a team multiplier who turns shared work into momentum',
    'Team Operator': 'a dependable teammate who helps groups move work forward',
    'Balanced Contributor': 'a versatile teammate who contributes independently and with others',
    'Independent Shipper': 'a focused builder who moves work forward with strong execution',
    'Independent Builder': 'a focused builder developing a broader collaboration profile',
  };

  const roleStatements = {
    'The Shipper': 'while consistently turning plans into shipped work',
    'The Strategist': 'while balancing planning, judgment, and execution',
    'The Coordinator': 'while connecting people and shared objectives',
    'The Operator': 'while building trust through dependable follow-through',
    'The Executor': 'while shipping relentlessly',
    'The Architect': 'while solving complex problems',
    'The Specialist': 'while delivering focused excellence',
  };

  const reliabilityTail = reliabilityScore >= 75
    ? ' with a strong reliability signal'
    : '';

  return `${statements[collab.type] || 'a valuable contributor'} ${roleStatements[role.type] || ''}${reliabilityTail}.`;
}
"""

def fail(message):
    print(f"\\n[patch_work_personality_growth_track] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_work_personality_growth_track] starting")

    if not WORK_PERSONALITY.exists():
        fail(f"Could not find {WORK_PERSONALITY}")

    original = WORK_PERSONALITY.read_text(encoding="utf-8")

    required_markers = [
        "export default function WorkPersonality",
        "getCollaborationStyle",
        "getPrimaryRole",
        "getHotZone",
        "getReliabilityMessage",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "getSkillProfile" in original and "Powered by Growth Track skill profile data" in original:
        print("[patch_work_personality_growth_track] WorkPersonality already appears Growth Track powered")
        return

    backup = WORK_PERSONALITY.with_suffix(WORK_PERSONALITY.suffix + ".bak-growth-track")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_work_personality_growth_track] backup created: {backup}")

    WORK_PERSONALITY.write_text(WORK_PERSONALITY_CODE, encoding="utf-8")
    print(f"[patch_work_personality_growth_track] patched: {WORK_PERSONALITY}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getSkillProfile|Powered by Growth Track|Your Work Personality|Independent Shipper|Reliability Score|Building data\" src/components/analytics/WorkPersonality.jsx")
    print("  git diff -- src/components/analytics/WorkPersonality.jsx")

if __name__ == "__main__":
    main()
