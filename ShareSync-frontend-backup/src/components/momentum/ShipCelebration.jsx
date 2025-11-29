// src/components/momentum/ShipCelebration.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Twitter, Share2, X } from 'lucide-react';
import lottie from "lottie-web";
import { shareToDiscover } from "../../services/ship";
import { track } from "../../utils/telemetry";
import { fireConfetti } from "../ui/Confetti";

export default function ShipCelebration({ project, open = false, onClose }) {
  const [sharing, setSharing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const lottieRef = useRef(null);
  const containerRef = useRef(null);

  // Generate confetti pieces
  useEffect(() => {
    if (open) {
      const pieces = Array.from({ length: 150 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360
      }));
      setConfettiPieces(pieces);
      
      // Show share options after 2 seconds
      setTimeout(() => setShowShare(true), 2000);
    }
  }, [open]);

  // Lottie animation
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

  const generateTweet = () => {
    const text = `🚀 Just shipped ${project?.title || 'my project'} on @ShareSyncHQ!\n\n${project?.description || ''}\n\nStill going. 🔥`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Lottie container */}
          <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />

          {/* Falling confetti */}
          <div className="fixed inset-0 z-[51] overflow-hidden pointer-events-none">
            {confettiPieces.map((piece) => (
              <div
                key={piece.id}
                className="absolute top-0 animate-fall"
                style={{
                  left: `${piece.left}%`,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: piece.size,
                    height: piece.size,
                    backgroundColor: piece.color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[52] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-600 to-pink-600 p-1 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center relative">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Rocket Icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    y: [0, -10, 0]
                  }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="mb-6 flex justify-center"
                >
                  <div className="relative">
                    <Rocket className="w-24 h-24 text-purple-400" />
                    <div className="absolute inset-0 blur-2xl bg-purple-500/50 animate-pulse" />
                  </div>
                </motion.div>

                {/* Text */}
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  YOU SHIPPED! 🎉
                </h2>
                <p className="text-xl text-white mb-2">{project.title}</p>
                <p className="text-sm text-slate-300 mb-6">
                  {project?.description || 'Another step forward. Keep going.'}
                </p>

                {/* Stats */}
                <div className="flex justify-center gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">+100</div>
                    <div className="text-xs text-slate-400">XP for team</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{project?.members?.length || 1}</div>
                    <div className="text-xs text-slate-400">Contributors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {project?.metrics?.streakDays || 0}
                    </div>
                    <div className="text-xs text-slate-400">Day Streak 🔥</div>
                  </div>
                </div>

                {/* Share Options */}
                {showShare && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex flex-col gap-3">
                      <a
                        href={generateTweet()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-lg shadow-blue-500/50 hover:scale-105"
                      >
                        <Twitter className="w-5 h-5" /> Share on Twitter
                      </a>
                      
                      <button
                        onClick={copyLink}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all border border-white/20 hover:scale-105"
                      >
                        <Share2 className="w-5 h-5" /> Copy Link
                      </button>

                      <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/50 hover:scale-105 disabled:opacity-50"
                      >
                        {sharing ? "Sharing..." : "Share to Discover"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {!showShare && (
                  <div className="text-sm text-slate-400 animate-pulse">
                    Preparing celebration...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <style jsx>{`
            @keyframes fall {
              from {
                transform: translateY(-100vh) rotate(0deg);
                opacity: 1;
              }
              to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
              }
            }
            .animate-fall {
              animation: fall linear infinite;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}