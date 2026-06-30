// src/components/ui/Skeleton.jsx
import React from "react";
import { cn } from "./cn";

/**
 * Basic skeleton primitives. (Adaptive Light/Dark Mode)
 *
 * <Skeleton className="h-32 rounded-xl" />                // block
 * <SkeletonLine width="60%" />                            // single line
 * <SkeletonText lines={3} lastWidth="70%" gap={10} />     // paragraph
 * <SkeletonCircle size={40} />                            // avatar
 */

export function Skeleton({ className, style, ...rest }) {
  return <div className={cn("sk sk-block animate-pulse bg-slate-200 dark:bg-[#1f1f23] rounded-md", className)} style={style} {...rest} />;
}

export function SkeletonLine({ width = "Available", className, style, height = 12, radius }) {
  return (
    <div
      className={cn("sk sk-line animate-pulse bg-slate-200 dark:bg-[#1f1f23]", className)}
      style={{
        width,
        height,
        borderRadius: radius ?? "var(--radius-sm, 8px)",
        ...style,
      }}
    />
  );
}

export function SkeletonCircle({ size = 40, className, style }) {
  return (
    <div
      className={cn("sk sk-circle animate-pulse bg-slate-200 dark:bg-[#1f1f23]", className)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        ...style,
      }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  gap = 8,
  lastWidth = "60%",
  className,
}) {
  const items = Array.from({ length: lines });
  return (
    <div className={cn("sk-text", className)} style={{ display: "grid", gap }}>
      {items.map((_, i) => (
        <SkeletonLine
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastWidth : "Available"}
        />
      ))}
    </div>
  );
}

export default Skeleton;
