import React from "react";
import { NavLink } from "react-router-dom";

/**
 * SidebarItem
 * Props:
 *  - to: string
 *  - label: string
 *  - icon: React component (Lucide)
 *  - count?: number
 *  - kbd?: string (optional keyboard hint text)
 *  - collapsed?: boolean (when true, show tooltip via title)
 */
export default function SidebarItem({ to, label, icon: Icon, count, kbd, collapsed = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "sb-item",
          isActive ? "sb-item--active" : "",
          collapsed ? "sb-item--collapsed" : "",
        ].join(" ")
      }
      aria-current={({ isActive }) => (isActive ? "page" : undefined)}
      title={collapsed ? label : undefined}
    >
      <span className="sb-item-leftbar" aria-hidden="true" />
      <span className="sb-ico" aria-hidden="true">
        <Icon className="w-4 h-4" />
      </span>
      {!collapsed && <span className="sb-label">{label}</span>}
      {!collapsed && typeof count === "number" && (
        <span className="sb-count" aria-label={`${count} ${label} updates`}>{count}</span>
      )}
      {!collapsed && kbd && <kbd className="sb-kbd">{kbd}</kbd>}
    </NavLink>
  );
}
