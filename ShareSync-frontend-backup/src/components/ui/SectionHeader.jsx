// /src/components/ui/SectionHeader.jsx
import React from "react";
import * as Icons from "lucide-react";

/**
 * SectionHeader
 * Usage:
 *   <SectionHeader icon="BarChartBig">Your KPIs</SectionHeader>
 *   <SectionHeader icon={Icons.ActivitySquare}>Recent Activity</SectionHeader>
 */
export default function SectionHeader({
  icon,
  children,
  className = "",
  iconClassName = "h-4 w-4",
  ...rest
}) {
  const IconCmp =
    typeof icon === "string" ? Icons[icon] : icon || Icons.Dot;

  return (
    <div
      className={["card-header", "inline-flex items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {IconCmp ? <IconCmp className={iconClassName} aria-hidden="true" /> : null}
      <span>{children}</span>
    </div>
  );
}
