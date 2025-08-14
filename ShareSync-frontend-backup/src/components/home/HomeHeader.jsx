// src/components/home/HomeHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import usePRM from "../../utils/usePrefersReducedMotion";

const XPProgressRing = ({ xp = 0, prefersReduced = false }) => {
  const radius = 40;
  const stroke = 8;
  const r = radius - stroke * 0.5;
  const C = r * 2 * Math.PI;
  const maxXP = 2000;
  const p = Math.min(xp / maxXP, 1);
  const dash = C - p * C;

  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block" aria-hidden="true">
      <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={r} cx={radius} cy={radius} />
      <circle
        stroke="#6366F1"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${C} ${C}`}
        style={{ strokeDashoffset: dash, transition: prefersReduced ? "none" : "stroke-dashoffset 0.5s ease" }}
        r={r}
        cx={radius}
        cy={radius}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-bold fill-slate-800 dark:fill-slate-100"
      >
        {xp} XP
      </text>
    </svg>
  );
};

export default function HomeHeader({
  username,
  firstName = "User",
  profilePic = "/default-profile.png",
  tier = "Newcomer",
  xp = 0,
  onInvite,
}) {
  const prefersReduced = usePRM();

  return (
    <section
      aria-label="Account overview"
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shadow-sm"
    >
      <div className="px-4 sm:px-6 md:px-8 py-5 grid grid-cols-12 items-center gap-4 md:gap-6">
        {/* Left: Avatar + Greeting */}
        <div className="col-span-12 md:col-span-5 flex items-center gap-3">
          <Link
            to={`/profile/${username}`}
            className="shrink-0 rounded-full ring-2 ring-white dark:ring-slate-800 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="View profile"
          >
            <img
              src={profilePic}
              alt={`${firstName} profile`}
              className="h-12 w-12 rounded-full object-cover"
              width={48}
              height={48}
              decoding="async"
              fetchPriority="high"
            />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Let’s make progress today.</p>
          </div>
        </div>

        {/* Center: XP ring */}
        <div className="col-span-12 md:col-span-3 flex justify-center">
          <div className="text-center">
            <XPProgressRing xp={xp} prefersReduced={prefersReduced} />
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Experience</div>
          </div>
        </div>

        {/* Right: Tier + Invite */}
        <div className="col-span-12 md:col-span-4 flex items-center justify-between md:justify-end gap-3">
          <div className="text-left md:text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Tier</div>
            <div className="text-base font-semibold text-indigo-600 dark:text-indigo-300">{tier}</div>
          </div>
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Invite teammate"
          >
            Invite Teammate
          </button>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700" />
    </section>
  );
}
