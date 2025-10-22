// src/components/nav/SidebarItem.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function SidebarItem({ to, icon: Icon, label, count, collapsed, ...rest }) {
  return (
    <NavLink
      to={to}
      {...rest}
      className={({ isActive }) =>
        ["sb-item", isActive ? "is-active" : ""].join(" ")
      }
    >
      <span className="sb-icon" aria-hidden="true">
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </span>
      {!collapsed && <span className="sb-label">{label}</span>}
      {!collapsed && typeof count !== "undefined" && (
        <span className="sb-count">{count}</span>
      )}
    </NavLink>
  );
}