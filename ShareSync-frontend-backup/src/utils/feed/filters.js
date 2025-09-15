/**
 * Small predicate helpers to filter a list of unified feed items.
 */

export function byType(type = 'all') {
    const t = String(type || 'all').toLowerCase();
    if (t === 'all') return () => true;
    return (item) => String(item?.type || '').toLowerCase() === t;
  }
  
  export function bySubtype(subtypes = []) {
    const set = new Set(
      (Array.isArray(subtypes) ? subtypes : [subtypes])
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
    );
    if (set.size === 0) return () => true;
    return (item) => set.has(String(item?.subtype || '').toLowerCase());
  }
  
  export function bySearch(query = '') {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return () => true;
    return (item) => {
      const hay = [
        item.text,
        item.task?.title,
        item.task?.notes,
        ...(Array.isArray(item.files) ? item.files.map((f) => f.name || f.filename || '') : []),
        JSON.stringify(item.meta || {}),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    };
  }
  
  /**
   * Apply filters and (optionally) sort desc by ts.
   * options: { type?: 'all'|'update'|'task'|'file'|'system', subtypes?: string[], query?: string, sort?: boolean }
   */
  export function filterItems(items = [], options = {}) {
    const { type = 'all', subtypes = [], query = '', sort = true } = options;
    const pred = and(byType(type), bySubtype(subtypes), bySearch(query));
    const out = (Array.isArray(items) ? items : []).filter(pred);
    if (!sort) return out;
    return out.sort((a, b) => +new Date(b.ts || 0) - +new Date(a.ts || 0));
  }
  
  /** Compose predicates (AND) */
  export function and(...preds) {
    const fns = preds.filter(Boolean);
    if (fns.length === 0) return () => true;
    return (x) => fns.every((fn) => fn(x));
  }
  