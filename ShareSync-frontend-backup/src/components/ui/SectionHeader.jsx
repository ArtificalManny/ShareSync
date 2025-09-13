import React from "react";
import * as Icons from "lucide-react";

/**
 * SectionHeader
 *
 * Examples:
 *   <SectionHeader icon="BarChartBig">Your KPIs</SectionHeader>
 *   <SectionHeader icon={Icons.ActivitySquare} actions={<MyMenu />}>Recent Activity</SectionHeader>
 *   <SectionHeader dotColor="var(--accent)">Projects</SectionHeader>
 *
 * Props:
 * - icon: string name from lucide-react or an Icon component (optional)
 * - dotColor: CSS color string for the tiny dot (used when no icon is provided)
 * - actions: ReactNode rendered on the right
 * - subtitle: string/ReactNode under the title
 * - level: aria heading level (default 3)
 * - className, iconClassName
 */
export function SectionHeader({
  icon,
  children,
  actions = null,
  subtitle = null,
  level = 3,
  className = "",
  iconClassName = "h-4 w-4",
  dotColor = "var(--accent)",
  ...rest
}) {
  const IconCmp = typeof icon === "string" ? Icons[icon] : icon;

  return (
    <div
      className={["card-header", "flex items-start justify-between gap-2", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {/* Left: icon/dot + title */}
      <div role="heading" aria-level={level} className="inline-flex items-center gap-2">
        {IconCmp ? (
          <IconCmp className={iconClassName} aria-hidden="true" />
        ) : (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
        )}
        <span className="leading-none">{children}</span>
      </div>

      {/* Right: actions */}
      {actions ? <div className="shrink-0 inline-flex items-center gap-1">{actions}</div> : null}

      {/* Optional subtitle */}
      {subtitle ? (
        <div className="basis-full pl-6 -mt-1">
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}

export default SectionHeader;