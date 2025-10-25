// src/components/command/commands.js
// Small set of built-in commands the palette can merge in.
// Keep this file UI-agnostic; only return objects with {id, label, hint?, icon?, run(nav)}

import { PlusCircle, CalendarCheck2, PaintBucket, SunMoon, Home, Folder } from "lucide-react";

export function getBaseCommands(navigate) {
  return [
    {
      id: "jump:home",
      label: "Go to Home",
      hint: "/home",
      icon: Home,
      run: () => navigate("/home"),
    },
    {
      id: "jump:projects",
      label: "Open Projects",
      hint: "/projects",
      icon: Folder,
      run: () => navigate("/projects"),
    },
    {
      id: "task:quick-add",
      label: "Quick add task",
      hint: "Open capture on Home",
      icon: PlusCircle,
      run: () => navigate("/home?capture=task"),
    },
    {
      id: "today:plan",
      label: "Plan my day",
      hint: "Today planner",
      icon: CalendarCheck2,
      run: () => navigate("/home?plan=today"),
    },
    {
      id: "theme:toggle",
      label: "Toggle dark / light",
      hint: "Appearance",
      icon: SunMoon,
      run: () => {
        // Generic toggle for CSS that keys off `.dark`
        const root = document.documentElement;
        root.classList.toggle("dark");
        // Also announce for anyone listening
        try { window.dispatchEvent(new CustomEvent("theme:toggled")); } catch {}
      },
    },
    {
      id: "accent:cycle",
      label: "Cycle accent",
      hint: "Pandora → CNBC → Proton",
      icon: PaintBucket,
      run: () => {
        // Fire a global event; Navbar/useBrandTheme can listen and call cycleAccent()
        try { window.dispatchEvent(new CustomEvent("accent:cycle")); } catch {}
      },
    },
  ];
}
