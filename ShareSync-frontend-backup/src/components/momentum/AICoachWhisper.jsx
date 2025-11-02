// src/components/momentum/AICoachWhisper.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { useStreak } from "../../hooks/useStreak";

const MESSAGES = [
  "You're 1 sprint from Top 10 — start now?",
  "Your streak ends in {hours}h — keep the fire alive!",
  "Top performers ship daily. You're next.",
  "Momentum compounds. One more task?",
  "Golden hour: 25 mins → max focus.",
];

export default function AICoachWhisper() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const { leaderboard } = useLeaderboard();
  const { streak, hoursUntilReset } = useStreak();

  useEffect(() => {
    const show = () => {
      let msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      if (msg.includes("{hours}") && hoursUntilReset > 0) {
        msg = msg.replace("{hours}", hoursUntilReset);
      }
      setMessage(msg);
      setVisible(true);

      setTimeout(() => setVisible(false), 6000);
    };

    // Trigger every 3–5 mins
    const interval = setInterval(show, 180000 + Math.random() * 120000);
    const timeout = setTimeout(show, 30000); // First nudge after 30s

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [hoursUntilReset]);

  const myRank = leaderboard.findIndex(u => u.isMe) + 1;
  const nearTop = myRank > 0 && myRank <= 11;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-2xl shadow-xl">
            <div className="bg-surface rounded-2xl p-4 flex items-start gap-3 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div>
                <p className="text-sm font-medium text-white">{message}</p>
                {nearTop && (
                  <p className="text-xs text-white/70 mt-1">
                    You’re #{myRank} — one sprint to glory.
                  </p>
                )}
              </div>
              <button
                onClick={() => setVisible(false)}
                className="ml-auto text-white/60 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}