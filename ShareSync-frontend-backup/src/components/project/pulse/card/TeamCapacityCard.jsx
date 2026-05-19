import React, { useMemo } from "react";
import {
  Users,
  Gauge,
  ShieldAlert,
  UserRoundCheck,
  Activity,
  AlertTriangle,
} from "lucide-react";

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.members)) return value.members;
  if (Array.isArray(value?.teamCapacity)) return value.teamCapacity;
  return [];
}

function readNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInitials(name) {
  const parts = String(name || "Project member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getToneClasses(tone) {
  if (tone === "risk") {
    return {
      card: "border-rose-200 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/[0.08]",
      badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
      bar: "bg-rose-500",
      avatar: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    };
  }

  if (tone === "watch") {
    return {
      card: "border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/[0.08]",
      badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      bar: "bg-amber-500",
      avatar: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }

  return {
    card: "border-slate-200 bg-white/80 dark:border-white/[0.07] dark:bg-white/[0.035]",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    bar: "bg-emerald-500",
    avatar: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  };
}

function normalizeTeamCapacity(metrics) {
  const raw = metrics?.teamCapacity || metrics || {};
  const rows = toArray(raw);

  const members = rows.map((member, index) => {
    const name =
      member.name ||
      member.fullName ||
      member.displayName ||
      [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
      member.email ||
      "Project member";

    const assigned = readNumber(member.assigned ?? member.assignedCount ?? member.taskCount, 0);
    const blocked = readNumber(member.blocked ?? member.blockedCount, 0);
    const loadPercent = Math.min(
      100,
      readNumber(member.loadPercent ?? member.load ?? member.capacity ?? member.score, assigned * 18 + blocked * 22)
    );

    const tone =
      member.tone ||
      (loadPercent >= 80 || blocked >= 3
        ? "risk"
        : loadPercent >= 50 || blocked > 0
          ? "watch"
          : "balanced");

    return {
      id: member.id || member._id || member.userId || member.email || index,
      name,
      email: member.email || "",
      avatar: member.avatar || member.avatarUrl || member.profilePicture || "",
      initials: member.initials || getInitials(name),
      role: member.role || member.displayRole || "Member",
      assigned,
      blocked,
      loadPercent,
      tone,
      statusLabel:
        member.statusLabel ||
        (tone === "risk" ? "Overloaded" : tone === "watch" ? "Watch" : "Balanced"),
    };
  });

  const memberCount = readNumber(raw.memberCount, members.length);
  const totalAssigned = readNumber(
    raw.totalAssigned ?? raw.assigned,
    members.reduce((sum, member) => sum + member.assigned, 0)
  );
  const totalBlocked = readNumber(
    raw.totalBlocked ?? raw.blocked,
    members.reduce((sum, member) => sum + member.blocked, 0)
  );
  const avgLoadPercent = readNumber(
    raw.avgLoadPercent ?? raw.avgLoad,
    members.length > 0
      ? Math.round(members.reduce((sum, member) => sum + member.loadPercent, 0) / members.length)
      : 0
  );
  const overloadedCount = readNumber(
    raw.overloadedCount,
    members.filter((member) => member.tone === "risk").length
  );

  return {
    memberCount,
    totalAssigned,
    totalBlocked,
    avgLoadPercent,
    overloadedCount,
    members,
  };
}

function MetricPill({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
      <div className="mb-2 flex items-center gap-2">
        {Icon ? <Icon className="h-3.5 w-3.5 text-cyan-500" /> : null}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
          {label}
        </p>
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function CapacityAvatar({ member }) {
  if (member.avatar) {
    return (
      <img
        src={member.avatar}
        alt={`${member.name} avatar`}
        className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white shadow-sm dark:ring-[#111113]"
      />
    );
  }

  const tone = getToneClasses(member.tone);

  return (
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black shadow-sm ${tone.avatar}`}>
      {member.initials}
    </div>
  );
}

function MemberCapacityRow({ member }) {
  const tone = getToneClasses(member.tone);

  return (
    <article className={`rounded-[22px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CapacityAvatar member={member} />

          <div className="min-w-0">
            <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
              {member.name}
            </h4>
            <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
              {member.assigned} assigned · {member.blocked} blocked
            </p>
          </div>
        </div>

        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${tone.badge}`}>
          {member.statusLabel}
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" />
          Load
        </span>
        <span>{member.loadPercent}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, member.loadPercent))}%` }}
        />
      </div>
    </article>
  );
}

export default function TeamCapacityCard({ metrics = {}, loading = false }) {
  const summary = useMemo(() => normalizeTeamCapacity(metrics), [metrics]);
  const members = summary.members;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(45,212,191,0.13),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(14,165,233,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Team Capacity
              </h3>
              <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                Load Map
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Workload, ownership, and blocker pressure by teammate.
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
          Live
        </span>
      </header>

      <div className="relative z-10 mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricPill label="Members" value={summary.memberCount} icon={Users} />
        <MetricPill label="Avg load" value={`${summary.avgLoadPercent}%`} icon={Gauge} />
        <MetricPill label="Assigned" value={summary.totalAssigned} icon={Activity} />
        <MetricPill label="Blocked" value={summary.totalBlocked} icon={ShieldAlert} />
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="rounded-[22px] border border-slate-200 bg-white/70 p-5 text-sm text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            Syncing team capacity…
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <MemberCapacityRow key={member.id} member={member} />
            ))}

            {summary.overloadedCount > 0 ? (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {summary.overloadedCount} teammate{summary.overloadedCount === 1 ? "" : "s"} near capacity. Reassign blockers before adding more work.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Capacity is balanced. No teammate is overloaded right now.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/60 px-6 py-8 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-300">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              No team capacity yet
            </p>
            <p className="mt-1 max-w-[280px] text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Add members and assign tasks to generate a live workload map.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
