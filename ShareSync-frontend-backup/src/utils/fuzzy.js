// /src/utils/fuzzy.js

/**
 * Normalize for case/accents.
 */
function norm(s) {
    return (s ?? "")
      .toString()
      .normalize?.("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
  
  /**
   * Lightweight fuzzy subsequence score in [0..1].
   * Rewards:
   *  - straight prefix matches
   *  - word-boundary starts
   *  - consecutive character runs
   * Penalizes:
   *  - long gaps between matched chars
   *
   * @param {string} text
   * @param {string} query
   * @returns {number} 0..1
   */
  export function fuzzyMatch(text, query) {
    const tRaw = text ?? "";
    const qRaw = query ?? "";
    const t = norm(tRaw);
    const q = norm(qRaw);
  
    if (!q) return t ? 0.4 : 0;       // empty query: mild baseline if text exists
    if (!t) return 0;
  
    // Fast path exact/prefix
    if (t === q) return 1;
    if (t.startsWith(q)) return Math.min(1, 0.85 + Math.min(0.15, q.length / Math.max(1, t.length)));
  
    // Subsequence walk
    let ti = 0;
    let qi = 0;
    let score = 0;
    let run = 0;       // consecutive run length
    let gaps = 0;      // total gaps between matches
  
    // Precompute word starts (positions after non-alphanum)
    const wordStart = new Set([0]);
    for (let i = 1; i < t.length; i++) {
      if (!/[a-z0-9]/.test(t[i - 1]) && /[a-z0-9]/.test(t[i])) wordStart.add(i);
    }
  
    while (ti < t.length && qi < q.length) {
      if (t[ti] === q[qi]) {
        // base per-char
        let charScore = 1;
  
        // boundary boost
        if (wordStart.has(ti)) charScore += 0.6;
  
        // consecutive run boost
        run += 1;
        charScore += Math.min(0.2 * (run - 1), 0.6);
  
        score += charScore;
        qi += 1;
      } else {
        // gap penalty only when we are in a run and break it
        if (run > 0) gaps += 1;
        run = 0;
      }
      ti += 1;
    }
  
    if (qi < q.length) return 0; // not all query chars matched
  
    // Normalize score by a rough upper bound:
    // per char max ~ (1 + 0.6 boundary + up to 0.6 run) ≈ 2.2
    const maxPerChar = 2.2;
    let normalized = Math.min(1, score / (q.length * maxPerChar));
  
    // Gap penalty (light): reduce slightly based on gap density vs text length
    const gapPenalty = Math.min(0.25, gaps / Math.max(1, t.length) * 0.6);
    normalized = Math.max(0, normalized - gapPenalty);
  
    // Minor bonus for shorter texts (more “precise”)
    const brevityBonus = Math.min(0.1, q.length / Math.max(1, t.length) * 0.2);
    normalized = Math.min(1, normalized + brevityBonus);
  
    return normalized;
  }
  
  /**
   * Optional helper: highlight matched characters with markers.
   * Returns an array of segments: [{ text, match:boolean }]
   * (So you can render <mark> around match segments if desired.)
   *
   * @param {string} text
   * @param {string} query
   * @returns {{ text:string, match:boolean }[]}
   */
  export function highlightSegments(text, query) {
    const tRaw = text ?? "";
    const qRaw = query ?? "";
    const t = norm(tRaw);
    const q = norm(qRaw);
  
    if (!q) return [{ text: tRaw, match: false }];
    if (!t) return [{ text: "", match: false }];
  
    // Find indices of a greedy subsequence match
    const idxs = [];
    let ti = 0, qi = 0;
    while (ti < t.length && qi < q.length) {
      if (t[ti] === q[qi]) {
        idxs.push(ti);
        qi++;
      }
      ti++;
    }
    if (qi < q.length) return [{ text: tRaw, match: false }];
  
    // Build segments from indices
    const segs = [];
    let last = 0;
    idxs.forEach((i) => {
      if (i > last) segs.push({ text: tRaw.slice(last, i), match: false });
      segs.push({ text: tRaw[i], match: true });
      last = i + 1;
    });
    if (last < tRaw.length) segs.push({ text: tRaw.slice(last), match: false });
    return segs;
  }
  