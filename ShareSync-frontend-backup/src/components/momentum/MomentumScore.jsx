// src/components/momentum/MomentumScore.jsx
import React from "react";
import { motion } from "framer-motion";
import { useMomentumScore } from "../../hooks/useMomentumScore";

export default function MomentumScore({ size = "lg" }) {
  const { score, label, isLoading } = useMomentumScore();

  const radius = size === "lg" ? 60 : 40;
  const stroke = size === "lg" ? 8 : 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const gradientId = `gradient-${size}`;

  if (isLoading) {
    return <div className={`w-${size === "lg" ? 32 : 20} h-${size === "lg" ? 32 : 20} bg-white/10 rounded-full animate-pulse`} />;
  }

  return (
    <div className={`relative ${size === "lg" ? "w-32 h-32" : "w-20 h-20"}`}>
      <svg
        width={radius * 2}
        height={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={score}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`font-bold ${size === "lg" ? "text-3xl" : "text-xl"} text-white`}
        >
          {score}
        </motion.div>
        <div className="text-[10px] text-white/70 mt-1">{label}</div>
      </div>

      {score >= 90 && (
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 blur-xl opacity-50 animate-pulse" />
      )}
    </div>
  );
}