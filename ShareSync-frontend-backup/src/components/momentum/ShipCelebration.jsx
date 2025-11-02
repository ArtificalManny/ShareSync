// src/components/momentum/ShipCelebration.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { shareToDiscover } from "../../services/ship";
import { track } from "../../utils/telemetry";

export default function ShipCelebration({ project, open = false, onClose }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      track("ship_celebration_opened", { projectId: project._id });
    }
  }, [open, project._id]);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareToDiscover(project._id);
      track("project_shipped", { projectId: project._id, shared: true });
    } catch (err) {
      console.error("Share failed", err);
    } finally {
      setSharing(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={200}
              gravity={0.15}
              onConfettiComplete={() => setShowConfetti(false)}
            />
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-600 to-pink-600 p-1 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-6xl mb-4"
                >
                  
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {project.title} Shipped!
                </h2>
                <p className="text-sm text-white/80 mb-6">
                  You just leveled up momentum. Share it with the world?
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="btn btn--primary px-6"
                  >
                    {sharing ? "Sharing..." : "Share to Discover"}
                  </button>
                  <button
                    onClick={onClose}
                    className="btn btn--outline text-white border-white/30"
                  >
                    Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}