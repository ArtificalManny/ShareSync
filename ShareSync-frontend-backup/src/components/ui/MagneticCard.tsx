import React, { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function MagneticCard({
  children,
  className = "",
  glowColor = "rgba(139, 92, 246, 0.5)",
  intensity = 1,
}: MagneticCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position relative to card center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring for smooth following
  const springConfig = { stiffness: 150, damping: 15 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Transform mouse position to glow position
  const glowX = useTransform(x, [-100, 100], [0, 100]);
  const glowY = useTransform(y, [-100, 100], [0, 100]);

  // Subtle rotation based on mouse
  const rotateX = useTransform(y, [-100, 100], [2 * intensity, -2 * intensity]);
  const rotateY = useTransform(x, [-100, 100], [-2 * intensity, 2 * intensity]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      {/* Magnetic glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            circle at calc(${glowX}%) calc(${glowY}%),
            ${glowColor} 0%,
            transparent 50%
          )`,
          opacity: isHovered ? 0.6 : 0,
        }}
        transition={{ opacity: { duration: 0.2 } }}
      />

      {/* Card content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
