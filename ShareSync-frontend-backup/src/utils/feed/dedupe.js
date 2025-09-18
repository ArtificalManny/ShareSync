/**
 * Feed dedupe helpers (moved out from ProjectHome.jsx for reuse/testing)
 */

/**
 * Build a stable identity key for a feed item.
 * Prefers id/_id/tempId; otherwise falls back to a composite of type+time+text snippet.
 * @param {any} it
 * @returns {string}
 */
export function getItemKey(it) {
    const primary =
      it?.id ?? it?._id ?? it?.tempId ?? "";
  
    if (primary && String(primary).length) {
      return String(primary);
    }
  
    const t = it?.ts || it?.createdAt || "";
    const type = it?.type || "?";
    const text = (it?.text || "").slice(0, 16);
    return `${type}:${t}:${text}`;
  }
  
  /**
   * Dedupe a list of items by their stable key while preserving order.
   * First occurrence wins.
   * @template T
   * @param {T[]} items
   * @returns {T[]}
   */
  export function dedupeById(items = []) {
    const seen = new Set();
    const out = [];
    for (const it of items) {
      const key = getItemKey(it);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
  }
  
  /**
   * Convenience: append new items to an existing list and return a deduped array.
   * Existing order is preserved; new items are appended (only if not seen).
   * @template T
   * @param {T[]} existing
   * @param {T[]} next
   * @returns {T[]}
   */
  export function appendDedupe(existing = [], next = []) {
    return dedupeById([...existing, ...next]);
  }
  
  export default dedupeById;
  