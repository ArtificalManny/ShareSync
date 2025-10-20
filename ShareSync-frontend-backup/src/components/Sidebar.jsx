// src/components/Sidebar.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Home,
  FolderKanban,
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Compass,
  ShieldCheck,
} from "lucide-react";
import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";

// Keep base styles + add neon skin
import "./Sidebar.css";
import "./Sidebar.neon.css";

import { track } from "../utils/telemetry";
import { DISCOVERY_V1, ADMIN_CONSOLE_V1 } from "../config/flags";
import useBrandTheme from "../hooks/useBrandTheme";

const LS_KEY = "ss.sidebar.collapsed";

/**
 * App Left Sidebar (collapsible, neon skin)
 * - Persists collapsed state in localStorage
 * - Adds/removes body classes so the content can offset via CSS vars
 * - Keyboard hint: '[' toggles collapse
 * - A11y: <nav> landmark, aria-expanded, focus-visible rings
 */
export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? raw === "1" : false;
    } catch {
      return false;
    }
  });

  // brand/accent attrs so CSS can theme the rail (pandora/cnbc/meta)
  const { containerAttrs } = useBrandTheme({ enabled: true });

  const tooltipWhenCollapsed = collapsed;

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      track("sidebar_toggled", { collapsed: next });
    } catch {}
  }, [collapsed]);

  // Persist + body class & CSS var for layout
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    } catch {}

    document.body.classList.add("has-sidebar");
    document.body.classList.toggle("sidebar-collapsed", collapsed);

    // Optional custom event for any listeners (analytics / layout)
    try {
      window.dispatchEvent(new CustomEvent("sidebar:toggle", { detail: { collapsed } }));
    } catch {}
  }, [collapsed]);

  // Keyboard '[' to toggle collapse (as hinted in UI)
  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in inputs
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "[") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Counts (wire up to real data if desired)
  const counts = useMemo(
    () => ({
      projects: undefined,
      home: undefined,
      settings: undefined,
      profile: undefined,
    }),
    []
  );

  const me = { name: "You", status: "online", avatarUrl: undefined, avatarEmoji: undefined };

  return (
    <aside
      {...containerAttrs}
      id="app-sidebar"
      className={["ss-sidebar", "neon-sidebar", collapsed ? "is-collapsed" : ""].join(" ")}
      aria-label="Primary"
    >
      {/* Neon vertical spine + subtle glow */}
      <span className="sb-rail" aria-hidden="true" />
      <span className="sb-ambient" aria-hidden="true" />

      {/* Header / Logo + collapse button */}
      <div className="sb-head">
        <div className="sb-brand" aria-hidden={collapsed ? "true" : "false"}>
          <span className="sb-logo">◆</span>
          {!collapsed && <span className="sb-title">ShareSync</span>}
        </div>
        <button
          type="button"
          className="sb-toggle"
          aria-pressed={collapsed ? "true" : "false"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={`Toggle sidebar [`}
          onClick={toggle}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Primary nav */}
      <nav className="sb-nav" aria-label="Primary">
        <SidebarItem
          to="/home"
          label="Home"
          icon={Home}
          count={counts.home}
          collapsed={tooltipWhenCollapsed}
        />

        {/* Discover (feature-gated) */}
        {DISCOVERY_V1 && (
          <SidebarItem
            to="/discover"
            label="Discover"
            icon={Compass}
            collapsed={tooltipWhenCollapsed}
          />
        )}

        <SidebarItem
          to="/projects"
          label="Projects"
          icon={FolderKanban}
          count={counts.projects}
          collapsed={tooltipWhenCollapsed}
        />
        <SidebarItem
          to="/profile"
          label="Profile"
          icon={UserIcon}
          count={counts.profile}
          collapsed={tooltipWhenCollapsed}
        />
        <SidebarItem
          to="/settings"
          label="Settings"
          icon={Settings}
          count={counts.settings}
          collapsed={tooltipWhenCollapsed}
        />

        {/* Admin Console (feature-gated) */}
        {ADMIN_CONSOLE_V1 && (
          <SidebarItem
            to="/admin/console"
            label="Admin"
            icon={ShieldCheck}
            collapsed={tooltipWhenCollapsed}
          />
        )}
      </nav>

      {/* Spacer */}
      <div className="sb-spacer" />

      {/* Bottom user block */}
      <div className="sb-user">
        <Avatar
          src={me.avatarUrl}
          name={me.name}
          size={36}
          status={me.status}
          ringColor="emerald"
          className="sb-user-avatar"
        />
        {!collapsed && (
          <div className="sb-user-text">
            <div className="sb-user-name" title={me.name}>
              {me.name}
            </div>
            <div className="sb-user-sub">Online</div>
          </div>
        )}
      </div>
    </aside>
  );
}
