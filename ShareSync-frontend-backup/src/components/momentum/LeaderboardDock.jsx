// src/components/momentum/LeaderboardDock.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { trackLeaderboardViewed } from "../../utils/telemetry";
import Avatar from "../ui/Avatar";

// ✅ Default OFF. Only shows if you explicitly enable it.
const ENABLE_LEADERBOARD_DOCK =
  import.meta.env.VITE_ENABLE_LEADERBOARD_DOCK === "true";

export default function LeaderboardDock() {
  // 🔒 Kill-switch: hides dock across all pages by default
  if (!ENABLE_LEADERBOARD_DOCK) return null;

  const { leaderboard, loading, error } = useLeaderboard({ limit: 10 });

  useEffect(() => {
    if (!loading && leaderboard.length > 0) {
      trackLeaderboardViewed({ count: leaderboard.length });
    }
  }, [loading, leaderboard]);

  if (loading) {
    return (
      <div className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] z-50 bg-surface/80 backdrop-blur-sm rounded-2xl p-4 space-y-3">
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

  const me = leaderboard.find((u) => u.isMe);
  const myRank = me ? leaderboard.indexOf(me) + 1 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] z-50 bg-gradient-to-b from-purple-900/20 to-transparent rounded-2xl p-4 border border-purple-500/20 backdrop-blur-sm"
    >
      <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-ping" />
        Top 10 This Week
      </h3>

      <div className="space-y-2">
        {leaderboard.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 group ${
              user.isMe ? "bg-purple-500/10 rounded-lg p-1" : ""
            }`}
          >
            <div className="text-xs font-bold text-purple-400 w-6 text-center">
              {i < 3 ? (
                <span className="text-lg">{["1st", "2nd", "3rd"][i]}</span>
              ) : (
                `#${i + 1}`
              )}
            </div>

            <Avatar
              src={user.avatar}
              name={user.name}
              size={28}
              className="ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all"
            />

            <div className="flex-1">
              <div className="text-sm font-medium text-white truncate">
                {user.name}
              </div>
              <div className="text-xs text-purple-300">
                {user.streak}d streak • {user.xp} XP
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {myRank && (
        <div className="mt-3 pt-3 border-t border-purple-500/30 text-xs text-purple-300 text-center font-medium">
          You're #{myRank} — keep shipping!
        </div>
      )}
    </motion.div>
  );
}
