// /src/utils/anchor.js

/**
 * Normalize a string to a stable, URL-safe slug.
 * - Lowercase
 * - Remove accents
 * - Keep letters/numbers; collapse spaces/dashes to single dash
 * - Trim to maxLen
 */
export function slugify(text, maxLen = 80) {
    const s = (text ?? "")
      .toString()
      .normalize?.("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return s.slice(0, maxLen);
  }
  
  /**
   * Build a DOM id for deep-linking.
   * Examples:
   *  makeAnchorId("task", "64f...") -> "task-64f..."
   *  makeAnchorId("doc", "h2-intro") -> "doc-h2-intro"
   *  makeAnchorId("para", 12) -> "para-12"
   */
  export function makeAnchorId(type, key) {
    const t = String(type || "a").toLowerCase();
    const k =
      typeof key === "number"
        ? String(key)
        : slugify(String(key || ""));
    return `${t}-${k}`;
  }
  
  /**
   * Build a full URL with #hash.
   * baseUrl defaults to current page (origin + pathname + search).
   */
  export function anchorHref(id, baseUrl) {
    const base =
      baseUrl ||
      (typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : "");
    return `${base}#${encodeURIComponent(id)}`;
  }
  
  /**
   * Copy the deep-link URL for a given id to the clipboard.
   * Options:
   *  - baseUrl: override the page base (useful for public routes)
   *  - onSuccess(url): callback on success
   *  - onError(err): callback on failure
   */
  export async function copyAnchorUrl(id, opts = {}) {
    const url = anchorHref(id, opts.baseUrl);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback: temporarily select text in a hidden textarea
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      opts.onSuccess?.(url);
      return url;
    } catch (err) {
      opts.onError?.(err);
      throw err;
    }
  }
  
  /**
   * Scroll to an element whose id matches the current (or provided) hash.
   * - Accepts "#task-123" or "task-123"
   * - Smooth scroll + focus for accessibility
   */
  export function scrollToAnchorFromHash(hash) {
    if (typeof document === "undefined") return false;
    const raw = hash ?? (typeof window !== "undefined" ? window.location.hash : "");
    const id = (raw || "").replace(/^#/, "");
    if (!id) return false;
  
    const el = document.getElementById(decodeURIComponent(id));
    if (!el) return false;
  
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      // Focus after a tick (if focusable)
      setTimeout(() => {
        if (typeof el.focus === "function") {
          el.tabIndex ??= -1; // ensure it can be focused
          el.focus({ preventScroll: true });
        }
      }, 120);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Convenience: set hash in the URL (replaceState so it doesn't pollute history).
   */
  export function setHashSilently(id) {
    if (typeof window === "undefined" || !id) return;
    const url = `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`;
    window.history.replaceState({}, "", url);
  }
  