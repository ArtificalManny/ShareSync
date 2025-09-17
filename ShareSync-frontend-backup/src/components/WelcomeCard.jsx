import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import "../styles/card.css"; // card-base / card-padding
import { getStreakMilestone } from "../utils/streakMilestones";
import GradientText from "../components/ui/GradientText.jsx";

export default function WelcomeCard({
  // Optional props (keeps backward compatibility with your Home.jsx usage)
  greeting,               // e.g. "Good afternoon, Manny"
  name = "Manny",
  profilePic = "/default-profile.png",
  suggestion,             // string (AI goal or tip)
  streakDays = 0,
  tasksCompleted = 0,
  lastLogin,              // not displayed but kept if you want to surface later
}) {
  const prefersReduced = useReducedMotion();
  const hello = greeting || `${getGreeting()}, ${name}`;
  const milestone = safeMilestone(getStreakMilestone(streakDays));

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.35 }}
      role="region"
      aria-labelledby="welcome-card-title"
      className={[
        "relative overflow-hidden rounded-3xl",
        "card-base card-padding",
        "border border-slate-200/70 dark:border-slate-700",
        "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800",
        "shadow-md",
      ].join(" ")}
    >
      {/* Accent bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500"
      />

      {/* Header row */}
      <div className="flex items-center gap-3">
        <img
          src={profilePic}
          alt=""
          className="h-10 w-10 rounded-full ring-2 ring-white/70 dark:ring-slate-900/60 object-cover"
        />
        <div className="min-w-0">
          <h2
            id="welcome-card-title"
            className="text-lg sm:text-xl font-semibold tracking-tight font-display"
          >
            <GradientText variant="ig">{hello}</GradientText>
            <span className="ml-1">👋</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            Let’s make progress today.
          </p>
        </div>
      </div>

      {/* Hero stripe pill with streak + tasks */}
      <div
        className={[
          "mt-4 rounded-2xl p-4",
          "bg-gradient-to-br from-indigo-50 via-white to-emerald-50",
          "dark:from-indigo-900/30 dark:via-slate-900 dark:to-emerald-900/20",
          "border border-indigo-200/60 dark:border-indigo-400/20",
          "shadow-inner",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="indigo" label="Streak" value={`${streakDays}d`} />
          <Chip tone="emerald" label="Tasks this week" value={String(tasksCompleted)} />
          {milestone && (
            <Chip
              tone="rose"
              label="Milestone"
              value={milestone}
              ariaLabel={`Streak milestone: ${milestone}`}
            />
          )}
        </div>

        <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300">
          {suggestion ? (
            <><span className="font-medium">Tip:</span> {suggestion}</>
          ) : (
            <>Stay consistent and finish strong 💪</>
          )}
        </p>
      </div>
    </motion.div>
  );
}

function Chip({ tone = "indigo", label, value, ariaLabel }) {
  const map = {
    indigo:  {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-200",
      ring: "ring-indigo-200/60 dark:ring-indigo-400/20",
      dot: "bg-indigo-500",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-200",
      ring: "ring-emerald-200/60 dark:ring-emerald-400/20",
      dot: "bg-emerald-500",
    },
    rose:    {
      bg: "bg-rose-50 dark:bg-rose-900/30",
      text: "text-rose-700 dark:text-rose-200",
      ring: "ring-rose-200/60 dark:ring-rose-400/20",
      dot: "bg-rose-500",
    },
  }[tone];

  return (
    <span
      role="status"
      aria-label={ariaLabel || `${label}: ${value}`}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        map.bg, map.text, "ring-1", map.ring,
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} aria-hidden="true" />
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function safeMilestone(m) {
  // Accept string or { label } from your util; return a short, friendly label
  if (!m) return "";
  if (typeof m === "string") return m;
  if (typeof m === "object" && (m.label || m.name)) return m.label || m.name;
  return "";
}
