// src/components/layout/PageHeader.jsx
import React from "react";
import Card from "../ui/Card.jsx";

/**
 * PageHeader
 * - Reusable hero/header for top-of-page sections.
 * - Keeps one primary h1 + optional subtitle and right-aligned actions.
 *
 * Props:
 *  - title: string | ReactNode
 *  - subtitle?: string | ReactNode
 *  - icon?: ReactNode          // small emoji/icon to the left of title
 *  - actions?: ReactNode       // buttons on the right
 *  - children?: ReactNode      // optional extra content under the header row
 *  - className?: string
 */
export default function PageHeader({
  title,
  subtitle = null,
  icon = null,
  actions = null,
  children = null,
  className = "",
}) {
  return (
    <Card className={`shine accent-bar ${className}`}>
      <div className="px-4 sm:px-6 md:px-8 py-5 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon ? <span className="text-xl" aria-hidden>{icon}</span> : null}
            <h1 className="h1 truncate">{title}</h1>
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-muted">{subtitle}</div>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>

      {children ? (
        <div className="px-4 sm:px-6 md:px-8 pb-5">{children}</div>
      ) : null}
    </Card>
  );
}
