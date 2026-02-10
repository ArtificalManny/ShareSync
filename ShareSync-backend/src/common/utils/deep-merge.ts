// src/common/utils/deep-merge.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DEEP MERGE (safe PATCH helper)
// - Recursively merges plain objects
// - Arrays are replaced by default (safer for PATCH semantics)
// - Undefined values are ignored (prevents accidental overwrite)
// ═══════════════════════════════════════════════════════════════════════════════

type PlainObject = Record<string, any>;

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export type DeepMergeOptions = {
  /**
   * If true, arrays are concatenated instead of replaced.
   * Default: false (replace arrays)
   */
  concatArrays?: boolean;

  /**
   * If true, `null` in source overwrites target.
   * Default: true
   */
  allowNullOverride?: boolean;
};

export function deepMerge<T extends PlainObject>(
  target: T,
  source: Partial<T>,
  options: DeepMergeOptions = {},
): T {
  const concatArrays = options.concatArrays ?? false;
  const allowNullOverride = options.allowNullOverride ?? true;

  if (!isPlainObject(target)) return (source as T) || target;
  if (!isPlainObject(source)) return target;

  const out: PlainObject = { ...target };

  for (const key of Object.keys(source)) {
    const srcVal = (source as any)[key];

    // Skip undefined to preserve PATCH semantics
    if (typeof srcVal === 'undefined') continue;

    // Optionally block null overrides
    if (srcVal === null && !allowNullOverride) continue;

    const tgtVal = (target as any)[key];

    if (Array.isArray(srcVal)) {
      if (concatArrays && Array.isArray(tgtVal)) {
        out[key] = [...tgtVal, ...srcVal];
      } else {
        out[key] = [...srcVal];
      }
      continue;
    }

    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      out[key] = deepMerge(tgtVal, srcVal, options);
      continue;
    }

    out[key] = srcVal;
  }

  return out as T;
}
