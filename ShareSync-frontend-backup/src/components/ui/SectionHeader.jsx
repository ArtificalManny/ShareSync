// /src/components/ui/SectionHeader.jsx
import React from "react";
import * as Icons from "lucide-react";

/**
 * SectionHeader
 * Usage:
 *   <SectionHeader icon="BarChartBig">Your KPIs</SectionHeader>
 *   <SectionHeader icon={Icons.ActivitySquare} actions={<MyMenu />}>
 *     Recent Activity
 *   </SectionHeader>
 *
 * Props:
 * - icon: string name from lucide-react or an Icon component
 * - actions: ReactNode rendered on the right (e.g. kebab / buttons)
 * - subtitle: optional helper text under the title
 * - level: heading level for aria (defaults to 3)
 * - className, iconClassName: style hooks
 */
export function SectionHeader({
  icon,
  children,
  actions = null,
  subtitle = null,
  level = 3,
  className = "",
  iconClassName = "h-4 w-4",
  ...rest
}) {
  const IconCmp =
    typeof icon === "string" ? Icons[icon] : icon || Icons.Dot;

  return (
    <div
      className={[
        "card-header",
        "flex items-start justify-between gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {/* Left: icon + title */}
      <div role="heading" aria-level={level} className="inline-flex items-center gap-2">
        {IconCmp ? <IconCmp className={iconClassName} aria-hidden="true" /> : null}
        <span className="leading-none">{children}</span>
      </div>

      {/* Right: actions */}
      {actions ? <div className="shrink-0 inline-flex items-center gap-1">{actions}</div> : null}

      {/* Optional subtitle */}
      {subtitle ? (
        <div className="basis-full pl-6 -mt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}

// Provide a default export for default-import style
export default SectionHeader;