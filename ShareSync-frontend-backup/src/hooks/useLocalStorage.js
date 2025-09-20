// Tiny, safe localStorage hook with cross-tab sync.
// Usage:
//   const [collapsed, setCollapsed, clearCollapsed] = useLocalStorage('ss.sidebar', false);

import { useEffect, useRef, useState } from 'react';

export default function useLocalStorage(key, initialValue, opts = {}) {
  const { serialize = JSON.stringify, deserialize = JSON.parse, sync = true } = opts;
  const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  const read = () => {
    if (!isBrowser) return typeof initialValue === 'function' ? initialValue() : initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? (typeof initialValue === 'function' ? initialValue() : initialValue) : deserialize(raw);
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  };

  const [value, setValue] = useState(read);
  const keyRef = useRef(key);

  // Write whenever value changes
  useEffect(() => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(keyRef.current, serialize(value));
      // Optional: notify same-tab listeners who aren't using 'storage'
      window.dispatchEvent(new CustomEvent('localstorage:update', { detail: { key: keyRef.current } }));
    } catch {
      /* ignore write errors (e.g., private mode quota) */
    }
  }, [value, serialize, isBrowser]);

  // React to key changes (rare)
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Cross-tab sync
  useEffect(() => {
    if (!isBrowser || !sync) return;
    const onStorage = (e) => {
      if (e.key !== keyRef.current) return;
      try {
        setValue(e.newValue === null ? (typeof initialValue === 'function' ? initialValue() : initialValue) : deserialize(e.newValue));
      } catch {
        /* ignore */
      }
    };
    const onCustom = (e) => {
      if (e?.detail?.key === keyRef.current) setValue(read());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('localstorage:update', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('localstorage:update', onCustom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sync]);

  const clear = () => {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(keyRef.current);
    } catch {}
    setValue(typeof initialValue === 'function' ? initialValue() : initialValue);
  };

  return [value, setValue, clear];
}
