// src/components/nav/SidebarItem.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function SidebarItem({ to, icon: Icon, label, count, collapsed, ...rest }) {
  const location = useLocation();

  const active =
    location.pathname === to ||
    location.pathname.startsWith(to + "/");

  const [spin, setSpin] = useState(false);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      setSpin(true);
      const t = setTimeout(() => setSpin(false), 1600);
      return () => clearTimeout(t);
    }
    prevActive.current = active;
  }, [active]);

  return (
    <NavLink
      to={to}
      {...rest}
      className={({ isActive }) => ["sb-item", isActive ? "is-active" : ""].join(" ")}
    >
      <span
        className={`sb-icon story-ring ${spin ? "ring-spin-once" : ""}`}
        aria-hidden="true"
      >
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </span>
      {!collapsed && <span className="sb-label">{label}</span>}
      {!collapsed && typeof count !== "undefined" && (
        <span className="sb-count">{count}</span>
      )}
    </NavLink>
  );
}