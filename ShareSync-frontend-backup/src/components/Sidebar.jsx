// src/components/layout/Sidebar.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Home,
  FolderKanban,
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Compass,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";

// FIXED: Correct relative paths from src/components/layout/
import StreakFlame from "./momentum/StreakFlame.jsx";
import CoWorkingAvatars from "./momentum/CoWorkingAvatars.jsx";
import LeaderboardDock from "./momentum/LeaderboardDock.jsx";

import "./Sidebar.css";
import "./Sidebar.neon.css";

import { track } from "../utils/telemetry";
import { DISCOVERY_V1, ADMIN_CONSOLE_V1 } from "../config/flags";
import useBrandTheme from "../hooks/useBrandTheme";

const LS_KEY = "ss.sidebar.collapsed";

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

  const { containerAttrs } = useBrandTheme({ enabled: true });

  const tooltipWhenCollapsed = collapsed;

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      track("sidebar_toggled", { collapsed: next });
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    } catch {}

    document.body.classList.add("has-sidebar");
    document.body.classList.toggle("sidebar-collapsed", collapsed);

    try {
      window.dispatchEvent(new CustomEvent("sidebar:toggle", { detail: { collapsed } }));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e) => {
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

  useEffect(() => {
    const items = Array.from(document.querySelectorAll(".sb-nav .sb-item"));
    items.forEach((el) => {
      if (el.dataset.route) return;

      const anchor = el.matches("a[href]") ? el : el.querySelector("a[href]");
      let href = anchor?.getAttribute("href") || "";

      let route = "";
      if (href && href.startsWith("/")) {
        const seg = href.split("/")[1];
        route = seg || "home";
      } else {
        const text = (el.textContent || "").toLowerCase();
        if (text.includes("home")) route = "home";
        else if (text.includes("discover")) route = "discover";
        else if (text.includes("project")) route = "projects";
        else if (text.includes("profile")) route = "profile";
        else if (text.includes("setting")) route = "settings";
        else if (text.includes("admin")) route = "admin";
      }

      if (route) el.setAttribute("data-route", route);
    });
  }, [location.pathname]);

  useEffect(() => {
    const activeIcon = document.querySelector(".sb-item.is-active .sb-icon");
    if (!activeIcon) return;

    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const isReload = nav ? nav.type === "reload" : true;
    const firstVisit = !sessionStorage.getItem("sb_ring_played");

    if (isReload || firstVisit) {
      activeIcon.classList.add("orbit-once");
      sessionStorage.setItem("sb_ring_played", "1");
      const t = setTimeout(() => activeIcon.classList.remove("orbit-once"), 1800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

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
      aria-expanded={collapsed ? "false" : "true"}
    >
      <span className="sb-rail" aria-hidden="true" />
      <span className="sb-ambient" aria-hidden="true" />

      <div className="sb-head">
        <div className="sb-brand" aria-hidden={collapsed ? "true" : "false"}>
          <span className="sb-logo">◆</span>
          {!collapsed && <span className="sb-title">ShareSync</span>}
        </div>
        <button
          type="button"
          className="sb-toggle focus-ring"
          aria-pressed={collapsed ? "true" : "false"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls="app-sidebar"
          aria-keyshortcuts="["
          title="Toggle sidebar ["
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      <nav className="sb-nav" aria-label="Primary" aria-orientation="vertical">
        <SidebarItem
          to="/home"
          label="Home"
          icon={Home}
          badge="AI"
          count={counts.home}
          collapsed={tooltipWhenCollapsed}
          data-route="home"
        />

        <SidebarItem
          to="/projects"
          label="Projects"
          icon={FolderKanban}
          count={counts.projects}
          collapsed={tooltipWhenCollapsed}
          data-route="projects"
        />

        <SidebarItem
          to="/discover"
          label="Discover"
          icon={Trophy}
          collapsed={tooltipWhenCollapsed}
          data-route="discover"
        />

        <SidebarItem
          to="/profile"
          label="Profile"
          icon={UserIcon}
          count={counts.profile}
          collapsed={tooltipWhenCollapsed}
          data-route="profile"
        />

        <SidebarItem
          to="/settings"
          label="Settings"
          icon={Settings}
          count={counts.settings}
          collapsed={tooltipWhenCollapsed}
          data-route="settings"
        />

        {ADMIN_CONSOLE_V1 && (
          <SidebarItem
            to="/admin/console"
            label="Admin"
            icon={ShieldCheck}
            collapsed={tooltipWhenCollapsed}
            data-route="admin"
          />
        )}
      </nav>

      {/* === MOMENTUM DOCK === */}
      <div className="sb-momentum px-3 mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <StreakFlame size={36} showCountdown={!collapsed} />
          {!collapsed && <CoWorkingAvatars />}
        </div>
        <LeaderboardDock />
      </div>

      <div className="sb-spacer" />

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