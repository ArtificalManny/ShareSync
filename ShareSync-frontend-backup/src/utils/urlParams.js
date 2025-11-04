// src/utils/urlParams.js
/** Debounce a value to limit API calls while typing */
export function useDebounce(value, delay = 350) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  
  /** Read filters from URL */
  export function readParams(search) {
    const p = new URLSearchParams(search);
    return {
      query: p.get('query') ?? '',
      status: p.get('status') ?? 'all',
      owner:  p.get('owner')  ?? 'all',
      updated: p.get('updated') ?? '7d',
    };
  }
  
  /** Write filters to URL */
  export function writeParams({ query, status, owner, updated }) {
    const p = new URLSearchParams();
    if (query) p.set('query', query);
    if (status && status !== 'all') p.set('status', status);
    if (owner && owner !== 'all') p.set('owner', owner);
    if (updated && updated !== '7d') p.set('updated', updated);
    const s = p.toString();
    return s ? `?${s}` : '';
  }