import { useEffect, useRef } from "react";

// Simple, dependency-free hotkey hook.
// Example: useHotkey('cmd+j', handler) or useHotkey('ctrl+k,cmd+k', handler)
export default function useHotkey(combos, handler, opts = {}) {
  const { target = typeof window !== "undefined" ? window : null, preventDefault = true, enabled = true } = opts;
  const saved = useRef(handler);

  useEffect(() => { saved.current = handler; }, [handler]);

  useEffect(() => {
    if (!target || !enabled) return;
    const comboList = String(combos).split(",").map((c) => parseCombo(c.trim()));

    function onKeyDown(e) {
      for (const combo of comboList) {
        if (match(e, combo)) {
          if (preventDefault) e.preventDefault();
          try { saved.current?.(e); } catch {}
          return;
        }
      }
    }

    target.addEventListener("keydown", onKeyDown);
    return () => target.removeEventListener("keydown", onKeyDown);
  }, [combos, target, enabled, preventDefault]);
}

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}
function parseCombo(s) {
  // supports: cmd, ctrl, alt, shift + key; key may be 'enter', 'escape', or a letter
  const parts = s.toLowerCase().split("+").map((p) => p.trim());
  const combo = { meta: false, ctrl: false, alt: false, shift: false, key: "" };
  for (const p of parts) {
    if (p === "cmd" || p === "meta") combo.meta = true;
    else if (p === "ctrl" || p === "control") combo.ctrl = true;
    else if (p === "alt" || p === "option") combo.alt = true;
    else if (p === "shift") combo.shift = true;
    else combo.key = normalizeKeyName(p);
  }
  // Normalize: on Windows, treat 'cmd' as 'ctrl' fallback unless combo explicitly asked for ctrl
  if (combo.meta && !isMac()) {
    combo.ctrl = true;
    combo.meta = false;
  }
  return combo;
}
function normalizeKeyName(k) {
  const map = { esc: "escape", return: "enter", space: " " };
  return map[k] || k;
}
function match(e, combo) {
  const key = normalizeKeyName(e.key?.toLowerCase());
  const okKey = combo.key ? key === combo.key : true;
  return (
    okKey &&
    (!!e.metaKey === !!combo.meta) &&
    (!!e.ctrlKey === !!combo.ctrl) &&
    (!!e.altKey === !!combo.alt) &&
    (!!e.shiftKey === !!combo.shift)
  );
}
