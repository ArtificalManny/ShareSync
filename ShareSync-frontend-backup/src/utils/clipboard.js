/**
 * Copy arbitrary text to clipboard with a DOM fallback.
 * Returns true on success, false on failure.
 */
export async function copyToClipboard(text) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(text));
        return true;
      }
    } catch {}
    try {
      const el = document.createElement("input");
      el.value = String(text);
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return !!ok;
    } catch {
      return false;
    }
  }
  