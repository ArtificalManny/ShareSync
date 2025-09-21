import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Creates an object URL for a Blob/MediaSource and revokes it when the
 * dependency changes or on unmount.
 */
export function useObjectUrl(blob?: Blob | MediaSource | null): { url: string | null; revoke: () => void } {
  const [url, setUrl] = useState<string | null>(null);
  const currentRef = useRef<string | null>(null);

  const revoke = useMemo(() => {
    return () => {
      if (currentRef.current) {
        URL.revokeObjectURL(currentRef.current);
        currentRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    revoke();
    if (blob) {
      const u = URL.createObjectURL(blob);
      currentRef.current = u;
      setUrl(u);
    } else {
      setUrl(null);
    }
    return revoke;
  }, [blob, revoke]);

  return { url, revoke };
}

export default useObjectUrl;
