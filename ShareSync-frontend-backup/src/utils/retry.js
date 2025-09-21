export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  /**
   * retry(fn, { tries, backoffMs })
   * - fn may return a promise or value
   */
  export async function retry(fn, opts = {}) {
    const tries = Math.max(1, opts.tries ?? 2);
    const backoffMs = Math.max(0, opts.backoffMs ?? 250);
    let lastErr;
    for (let i = 0; i < tries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (i < tries - 1) await wait(backoffMs * (i + 1));
      }
    }
    throw lastErr;
  }
  