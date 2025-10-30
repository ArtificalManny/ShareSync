// /src/components/global/CommandPalette.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command, Play, Pause, RotateCcw, Search, Folder, CheckCircle2,
  Hash, ChevronRight, Loader2, MessageCircle
} from "lucide-react";
import { useSprint } from "../../context/SprintContext";
import { useCommandPalette } from "../../hooks/useCommandPalette";
import { fuzzyMatch } from "../../utils/fuzzy";
import { getBaseCommands } from "../command/command";

// 🔒 Do NOT import ../../api/search at the top.
// We’ll lazy-load it inside the effect so a missing client can’t crash the app.

const ROUTE_ITEMS = [
  { id: "route:home",    label: "Go to Home",    hint: "/home",    icon: Hash,    run: (nav) => nav("/home") },
  { id: "route:projects",label: "Open Projects", hint: "/projects",icon: Folder,  run: (nav) => nav("/projects") },
  { id: "route:settings",label: "Open Settings", hint: "/settings",icon: Hash,    run: (nav) => nav("/settings") },
  { id: "route:profile", label: "My Profile",    hint: "/me",      icon: Hash,    run: (nav) => nav("/me") },
  { id: "route:message", label: "Open Messenger",hint: "/messages",icon: MessageCircle, run: (nav) => nav("/messages") },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, close } = useCommandPalette();
  const { status, start, pause, resume, reset } = useSprint();

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamic, setDynamic] = useState({ projects: [], tasks: [] });
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
    else {
      setQuery(""); setActiveIdx(0); setDynamic({ projects: [], tasks: [] });
    }
  }, [isOpen]);

  // 🔌 Lazy-load backend search; if it fails, we silently fall back to local commands.
  useEffect(() => {
    let alive = true;
    const q = query.trim();
    if (!q) { setDynamic({ projects: [], tasks: [] }); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const mod = await import(/* @vite-ignore */ "../../api/search").catch(() => null);
        const searchAll = mod?.searchAll;
        if (!alive || !searchAll) { setDynamic({ projects: [], tasks: [] }); return; }

        const res = await searchAll({ q, types: ["project","task"], limit: 8 });
        if (!alive) return;
        setDynamic({
          projects: Array.isArray(res?.projects) ? res.projects.slice(0, 6) : [],
          tasks: Array.isArray(res?.tasks) ? res.tasks.slice(0, 8) : [],
        });
      } catch {
        if (alive) setDynamic({ projects: [], tasks: [] });
      } finally {
        if (alive) setLoading(false);
      }
    }, 140);

    return () => { alive = false; clearTimeout(timer); };
  }, [query]);

  const sprintItems = useMemo(() => {
    const items = [];
    if (status === "idle" || status === "completed") items.push({ id:"sprint:start",  label:"Sprint: Start",  icon:Play,      run: () => start({}) });
    if (status === "running")                          items.push({ id:"sprint:pause",  label:"Sprint: Pause",  icon:Pause,     run: () => pause() });
    if (status === "paused")                           items.push({ id:"sprint:resume", label:"Sprint: Resume", icon:Play,      run: () => resume() });
    items.push({ id:"sprint:reset", label:"Sprint: Reset", icon:RotateCcw, run: () => reset({}) });
    return items;
  }, [status, start, pause, resume, reset]);

  const candidates = useMemo(() => {
    const q = query.trim();
    const extra = getBaseCommands(navigate);
    const base = [
      ...ROUTE_ITEMS.map(x => ({ ...x, kind:"route" })),
      ...sprintItems.map(x => ({ ...x, kind:"sprint" })),
      ...extra.map(x => ({ ...x, kind:"command" })),
      ...dynamic.projects.map(p => ({
        id:`proj:${p._id || p.id}`, kind:"project",
        label:p.title || p.name || "Untitled project", hint:"Project", icon:Folder,
        run: () => navigate(`/projects/${p._id || p.id}`)
      })),
      ...dynamic.tasks.map(t => ({
        id:`task:${t._id || t.id}`, kind:"task",
        label:t.title || "Untitled task",
        hint:(t.projectTitle ? `Task · ${t.projectTitle}` : "Task"),
        icon:CheckCircle2,
        run: () => {
          if (t.projectId || t.project_id) navigate(`/projects/${t.projectId || t.project_id}?task=${t._id || t.id}`);
          else navigate(`/projects`);
        }
      })),
    ];

    if (q) base.unshift({ id:`route:search:${q}`, kind:"route", label:`Search "${q}"`, hint:"/search",
      run: () => navigate(`/search?q=${encodeURIComponent(q)}`) });

    if (!q) return base.slice(0, 10);

    const scored = base
      .map(item => {
        const s1 = fuzzyMatch(item.label, q);
        const s2 = item.hint ? fuzzyMatch(item.hint, q) * 0.4 : 0;
        return { item, score: Math.max(s1, s2) };
      })
      .filter(x => x.score > 0.2)
      .sort((a,b) => b.score - a.score)
      .map(x => x.item);

    return scored.slice(0, 12);
  }, [query, dynamic, sprintItems, navigate]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, Math.max(0, candidates.length - 1))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const sel = candidates[activeIdx]; if (sel) { try { sel.run(navigate); } finally { close(); } } }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cmdk-overlay" onClick={close} aria-hidden="true" />
      <div className="cmdk-panel">
        <div className="px-3 py-2 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-2">
          <Command className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command, project, or task…"
            className="cmdk-input"
            aria-activedescendant={candidates[activeIdx]?.id || undefined}
          />
          <kbd className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-500">Esc</kbd>
        </div>

        <div ref={listRef} role="listbox" className="max-h-[60vh] overflow-auto p-1">
          {loading && (
            <div className="px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}
          {candidates.length === 0 && !loading && (
            <div className="px-3 py-3 text-sm text-slate-500 flex items-center gap-2">
              <Search className="h-4 w-4" /> No matches. Try a different phrase.
            </div>
          )}
          {candidates.map((c, idx) => {
            const Icon = c.icon || Search;
            const active = idx === activeIdx;
            return (
              <button
                key={c.id}
                role="option"
                aria-selected={active ? "true" : "false"}
                className={`cmdk-row ${active ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => { try { c.run(navigate); } finally { close(); } }}
              >
                <Icon className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-slate-900 dark:text-slate-100 truncate">{c.label}</div>
                  {c.hint && <div className="text-[11px] text-slate-500 truncate">{c.hint}</div>}
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </div>

        <div className="px-3 py-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-4">
          <span className="inline-flex items-center gap-1"><kbd className="px-1 rounded border">↑</kbd><kbd className="px-1 rounded border">↓</kbd> to navigate</span>
          <span className="inline-flex items-center gap-1"><kbd className="px-1 rounded border">Enter</kbd> to select</span>
          <span className="ml-auto inline-flex items-center gap-1"><kbd className="px-1 rounded border">⌘</kbd>/<kbd className="px-1 rounded border">Ctrl</kbd> + <kbd className="px-1 rounded border">K</kbd> to open</span>
        </div>
      </div>
    </>
  );
}
