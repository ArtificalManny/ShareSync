import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { searchUsers } from "../../api/users";
import { trackMentionSent } from "../../utils/telemetry";

/**
 * MentionsProvider
 * Context to help textareas support @mentions with a simple inline menu.
 *
 * Usage:
 *  <MentionsProvider>
 *    <PostComposer ... />
 *  </MentionsProvider>
 *
 * In a textarea:
 *  - Call useMentions() to get: { menu, onKeyDown, onChange, attach, extractMentions }
 *  - Spread { onKeyDown, onChange, ref: attach } onto your textarea
 *  - Render {menu} near the textarea
 */

const MentionsCtx = createContext(null);

export function MentionsProvider({ children }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const fetchRef = useRef(0);
  const textareaRef = useRef(null);

  // Attach a textarea DOM node
  const attach = (el) => {
    textareaRef.current = el;
    setAnchorEl(el);
  };

  // Detect current @word query based on caret position
  function detectQuery(value, caret) {
    // Look left from caret for "@xxxxx"
    const left = value.slice(0, caret);
    const m = left.match(/(^|\s)@([a-zA-Z0-9_.-]{0,32})$/);
    if (!m) return null;
    return m[2]; // can be '' while just typed '@'
  }

  async function runSearch(q) {
    const rid = ++fetchRef.current;
    try {
      const res = await searchUsers(q || "", { limit: 8 });
      if (fetchRef.current !== rid) return;
      const mapped = (Array.isArray(res) ? res : []).map((u) => ({
        id: u._id || u.id,
        username: u.username || u.handle || u.email?.split("@")[0] || "user",
        name: u.name || u.fullName || u.displayName || u.username || "",
        avatarUrl: u.avatarUrl || null,
      }));
      setItems(mapped);
      setActiveIdx(0);
    } catch {
      if (fetchRef.current !== rid) return;
      setItems([]);
      setActiveIdx(0);
    }
  }

  const onChange = (e) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const q = detectQuery(el.value, caret);
    if (q === null) {
      setOpen(false);
      setQuery("");
      setItems([]);
      return;
    }
    setOpen(true);
    setQuery(q);
    runSearch(q);
  };

  const insertAt = (username) => {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value;
    const caret = el.selectionStart ?? value.length;
    const left = value.slice(0, caret);
    const right = value.slice(caret);
    // Replace "@partial" with "@username "
    const replacedLeft = left.replace(/(^|\s)@([a-zA-Z0-9_.-]{0,32})$/, `$1@${username} `);
    const nextValue = replacedLeft + right;
    const newCaret = replacedLeft.length;
    el.value = nextValue;
    el.setSelectionRange(newCaret, newCaret);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    setOpen(false);
    setQuery("");
    setItems([]);
    try { trackMentionSent?.({ username }); } catch {}
  };

  const onKeyDown = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = items[activeIdx];
      if (choice) insertAt(choice.username);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // Extract mentions from a text (unique usernames)
  const extractMentions = (text = "") => {
    const names = Array.from(text.matchAll(/(^|\s)@([a-zA-Z0-9_.-]{1,32})\b/g)).map((m) => m[2]);
    return Array.from(new Set(names));
  };

  const menu = open && items.length > 0 ? (
    <div
      role="listbox"
      aria-label="Mention suggestions"
      className="z-50 mt-1 w-[min(320px,Available)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
      style={{ position: "absolute" }}
    >
      {items.map((u, i) => (
        <button
          key={u.id || u.username || i}
          role="option"
          aria-selected={i === activeIdx}
          className={[
            "w-full text-left px-3 py-2 text-sm flex items-center gap-2",
            i === activeIdx ? "bg-slate-100 dark:bg-slate-800" : ""
          ].join(" ")}
          onMouseDown={(e) => { e.preventDefault(); insertAt(u.username); }}
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-slate-200" aria-hidden />
          )}
          <span className="font-medium">@{u.username}</span>
          {u.name ? <span className="text-xs text-slate-500">· {u.name}</span> : null}
        </button>
      ))}
    </div>
  ) : null;

  const value = useMemo(
    () => ({ menu, onKeyDown, onChange, attach, extractMentions }),
    [menu]
  );
  return <MentionsCtx.Provider value={value}>{children}</MentionsCtx.Provider>;
}

export default MentionsProvider;

export function useMentions() {
  return useContext(MentionsCtx) || {
    menu: null,
    onKeyDown: () => {},
    onChange: () => {},
    attach: () => {},
    extractMentions: () => [],
  };
}
