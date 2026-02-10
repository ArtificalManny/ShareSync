/**
 * Deep merge two objects. Arrays are replaced (not concatenated).
 * Safe for merging nested user preferences without wiping sections.
 */
export function deepMerge<T extends Record<string, any>>(
  base: T,
  patch: Partial<T>,
): T {
  const out: any = Array.isArray(base) ? [...base] : { ...(base || {}) };

  if (!patch || typeof patch !== 'object') return out;

  for (const key of Object.keys(patch)) {
    const pv: any = (patch as any)[key];
    const bv: any = (out as any)[key];

    if (pv === undefined) continue;

    // Replace arrays entirely
    if (Array.isArray(pv)) {
      out[key] = pv;
      continue;
    }

    // Merge objects recursively
    const pvIsObj = pv && typeof pv === 'object' && !Array.isArray(pv);
    const bvIsObj = bv && typeof bv === 'object' && !Array.isArray(bv);

    if (pvIsObj && bvIsObj) {
      out[key] = deepMerge(bv, pv);
      continue;
    }

    // Primitive / null / or object replacing primitive
    out[key] = pv;
  }

  return out;
}
