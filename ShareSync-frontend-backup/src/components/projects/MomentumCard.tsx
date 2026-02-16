import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MagneticCard } from "@/components/ui/MagneticCard";
import { getBreathingAnimation } from "@/lib/motion";

interface MomentumCardProps {
  momentum: number; // 0-100
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function getMomentumConfig(momentum: number) {
  if (momentum >= 80) {
    return {
      color: "var(--momentum-fire)",
      glow: "var(--color-momentum-fire-glow)",
      bg: "var(--color-momentum-fire-subtle)",
      label: "On Fire 🔥",
      intensity: 1.5,
    };
  }
  if (momentum >= 60) {
    return {
      color: "var(--color-momentum-building)",
      glow: "var(--color-momentum-building-glow)",
      bg: "var(--color-momentum-building-subtle)",
      label: "Building ⚡",
      intensity: 1.2,
    };
  }
  if (momentum >= 40) {
    return {
      color: "var(--color-momentum-warming)",
      glow: "var(--color-momentum-warming-glow)",
      bg: "var(--color-momentum-warming-subtle)",
      label: "Warming Up 💜",
      intensity: 1,
    };
  }
  if (momentum >= 20) {
    return {
      color: "var(--color-momentum-starting)",
      glow: "var(--color-momentum-starting-glow)",
      bg: "var(--color-momentum-starting-subtle)",
      label: "Getting Started 💙",
      intensity: 0.8,
    };
  }
  return {
    color: "var(--color-momentum-attention)",
    glow: "var(--color-momentum-attention-glow)",
    bg: "var(--color-momentum-attention-subtle)",
    label: "Needs Attention 🩶",
    intensity: 0.5,
  };
}

export function MomentumCard({
  momentum,
  children,
  className = "",
  onClick,
}: MomentumCardProps) {
  const config = getMomentumConfig(momentum);

  // IMPORTANT:
  // getBreathingAnimation() likely returns `transition.ease` typed as `string` (or untyped),
  // which Framer Motion TS rejects. We cast at the call-site to avoid rippling changes.
  const breathingAnimation = useMemo(
    () => (getBreathingAnimation(momentum) as unknown as any),
    [momentum]
  );

  return (
    <MagneticCard glowColor={config.glow} intensity={config.intensity} className={className}>
      <motion.div
        onClick={onClick}
        {...breathingAnimation}
        className="relative p-6 rounded-xl cursor-pointer bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-200"
        style={{
          borderColor: momentum >= 80 ? config.color : undefined,
        }}
      >
        {/* Momentum indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden bg-surface-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${momentum}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full"
            style={{ background: config.color }}
          />
        </div>

        {/* Momentum badge */}
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: config.bg,
            color: config.color,
          }}
        >
          {config.label}
        </div>

        {/* Content */}
        <div className="mt-4">{children}</div>
      </motion.div>
    </MagneticCard>
  );
}
