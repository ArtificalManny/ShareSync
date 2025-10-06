import React from "react";
import { cn } from "./cn";
import * as Icons from "lucide-react";

export default function SectionHeader({
  icon,                     // "Activity", "Gauge", etc. or a ReactNode
  children,
  className = "",
  actions = null,           // right-side element (buttons/menus)
}) {
  const IconCmp =
    typeof icon === "string" && Icons[icon] ? Icons[icon] :
    React.isValidElement(icon) ? () => icon : null;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="inline-flex items-center gap-2">
        {IconCmp ? <IconCmp className="w-5 h-5 text-indigo-600" /> : null}
        <h3 className="title-card">{children}</h3>
      </div>
      {actions}
    </div>
  );
}
