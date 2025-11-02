// src/components/momentum/TopTenPulse.jsx
import React from "react";
import { motion } from "framer-motion";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import Avatar from "../ui/Avatar";

export default function TopTenPulse() {
  const { leaderboard, loading, error } = useLeaderboard();

  if (loading) {
    return (
      <div className="bg-surface/80 backdrop-blur-sm rounded-2xl p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            <div className="flex-1 h-3 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !leaderboard.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-purple-900/20 to-transparent rounded-2xl p-4 border border-purple-500/20"
    >
      <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-ping" />
        Top 10 This Week
      </h3>

      <div className="space-y-2">
        {leaderboard.slice(0, 10).map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 group"
          >
            <div className="text-xs font-bold text-purple-400 w-5">
              {i < 3 ? ["1st", "2nd", "3rd"][i] : `#${i + 1}`}
            </div>
            <Avatar
              src={user.avatar}
              name={user.name}
              size={28}
              className="ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-purple-300">
                {user.streak}d streak • {user.xp} XP
              </div>
            </div>
            {i < 3 && (
              <span className="text-lg">
                {i === 0 ? "1st" : i === 1 ? "2nd" : "3rd"}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {leaderboard.find(u => u.isMe) && (
        <div className="mt-3 pt-3 border-t border-purple-500/30 text-xs text-purple-300">
          You’re #{leaderboard.findIndex(u => u.isMe) + 1} — keep shipping!
        </div>
      )}
    </motion.div>
  );
}