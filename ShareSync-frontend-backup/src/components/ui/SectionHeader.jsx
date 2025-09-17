import React from "react";
import * as Icons from "lucide-react";

/**
 * SectionHeader
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
      className={[
        "card-header",
        "flex items-start justify-between gap-2 sm:gap-3 chart-fade-in",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {/* Left: gradient icon chip + title */}
      <div role="heading" aria-level={level} className="inline-flex items-center gap-2">
        {IconCmp ? (
          <span
            className="inline-flex items-center justify-center rounded-lg bg-grad-purple text-white"
            style={{ width: 28, height: 28 }}
            aria-hidden="true"
          >
            <IconCmp className={iconClassName} />
          </span>
        ) : (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
        )}
        <span
          className="font-display leading-none tracking-tight font-semibold"
          style={{
            fontSize: "var(--fs-lg)",
            lineHeight: "var(--lh-tight)",
          }}
        >
          {children}
        </span>
      </div>

      {/* Right: actions */}
      {actions ? <div className="shrink-0 inline-flex items-center gap-1">{actions}</div> : null}

      {/* Optional subtitle */}
      {subtitle ? (
        <div className="basis-full pl-8 sm:pl-9 -mt-1">
          <p
            className="text-muted"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              lineHeight: "var(--lh-normal)",
            }}
          >
            {subtitle}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default SectionHeader;
