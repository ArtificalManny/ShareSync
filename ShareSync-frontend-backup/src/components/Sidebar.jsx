import React, { useEffect, useMemo, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, FolderKanban, User as UserIcon, Settings, ChevronsLeft } from "lucide-react";
import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";
import "./Sidebar.css";
import { track } from "../utils/telemetry";

// localStorage key
const LS_KEY = "ss.sidebar.collapsed";

/**
 * App Left Sidebar (collapsible)
 * - Persists collapsed state in localStorage
 * - Adds/removes body classes so the content can offset via CSS vars
 * - Keyboard hint: '[' toggles collapse
 * - A11y: <nav> landmark, aria-expanded, focus-visible rings
 */
export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? raw === "1" : false;
  });

  // Derive tooltip mode from collapsed state
  const tooltipWhenCollapsed = collapsed;

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try { track("sidebar_toggled", { collapsed: next }); } catch {}
  }, [collapsed]);

  // Persist + body class & CSS var for layout
  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? "1" : "0");

    document.body.classList.add("has-sidebar");
    document.body.classList.toggle("sidebar-collapsed", collapsed);

    // Optional: fire a custom event so analytics can listen
    try {
      window.dispatchEvent(new CustomEvent("sidebar:toggle", { detail: { collapsed } }));
    } catch {}
    return () => {
      // We keep has-sidebar; if you ever unmount the Sidebar entirely, you can clean up here.
    };
  }, [collapsed]);

  // Global '[' hotkey, but avoid when typing in inputs/textareas
  useEffect(() => {
    const onKey = (e) => {
      const tag = String(e.target?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;
      if (e.key === "[") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // (Optional) Active counts; wire your unread/metrics here
  const counts = useMemo(
    () => ({
      projects: undefined, // e.g., number
      home: undefined,
      settings: undefined,
      profile: undefined,
    }),
    []
  );

  // (Optional) bottom user block data; you can swap to your UserContext
  // and pass avatar src/emoji/name. Default to placeholders.
  const me = { name: "You", status: "online", avatarUrl: undefined, avatarEmoji: undefined };

  return (
    <aside
      className={["ss-sidebar", collapsed ? "is-collapsed" : ""].join(" ")}
      aria-label="Primary"
    >
      {/* Header / Logo + collapse button */}
      <div className="sb-head">
        <div className="sb-brand" aria-hidden={!collapsed ? "false" : "true"}>
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
