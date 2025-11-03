// src/components/momentum/ShipCelebration.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lottie from "lottie-web";
import { shareToDiscover } from "../../services/ship";
import { track } from "../../utils/telemetry";
import { fireConfetti } from "../ui/Confetti";

export default function ShipCelebration({ project, open = false, onClose }) {
  const [sharing, setSharing] = useState(false);
  const lottieRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && containerRef.current) {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/assets/confetti.json",
      });

      anim.addEventListener("complete", () => {
        fireConfetti({ particles: 120, spread: 100, duration: 1400 });
      });

      return () => anim.destroy();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
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
          <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-600 to-pink-600 p-1 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-6xl mb-4"
                >
                  Rocket
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