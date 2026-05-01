from pathlib import Path
from datetime import datetime

TARGET = Path("src/api/ai.js")

HELPER_BLOCK = """function notifyAiUsageUpdated(detail = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    source: 'ai',
    resource: 'aiCalls',
    updatedAt: Date.now(),
    ...detail,
  };

  window.dispatchEvent(new CustomEvent('ai:usage-updated', { detail: payload }));
  window.dispatchEvent(new CustomEvent('subscription:refresh', { detail: payload }));
  window.dispatchEvent(new CustomEvent('subscription:changed', { detail: payload }));
  window.dispatchEvent(new CustomEvent('subscription-usage-updated', { detail: payload }));
}

"""

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"[patch_ai_usage_refresh_events] ERROR: {label}: expected 1 occurrence, found {count}"
        )
    return text.replace(old, new, 1)

def main():
    print("[patch_ai_usage_refresh_events] starting")

    if not TARGET.exists():
        raise SystemExit(f"[patch_ai_usage_refresh_events] ERROR: missing {TARGET}")

    original = TARGET.read_text()
    updated = original

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".js.bak.before-ai-usage-refresh-events-{timestamp}")
    backup.write_text(original)

    if "function notifyAiUsageUpdated" not in updated:
        updated = replace_once(
            updated,
            "import client from './client';\n\n",
            "import client from './client';\n\n" + HELPER_BLOCK,
            "insert notifyAiUsageUpdated helper after import"
        )
        print("[patched] inserted notifyAiUsageUpdated helper")
    else:
        print("[skipped] notifyAiUsageUpdated helper already exists")

    old_chat_return = """  const res = await client.post('/ai/chat', {
    ...payload,
    mentorTone,
  });
  return res.data;
"""

    new_chat_return = """  const res = await client.post('/ai/chat', {
    ...payload,
    mentorTone,
  });

  notifyAiUsageUpdated({ endpoint: '/ai/chat' });

  return res.data;
"""

    if "notifyAiUsageUpdated({ endpoint: '/ai/chat' });" not in updated:
        updated = replace_once(
            updated,
            old_chat_return,
            new_chat_return,
            "add AI usage refresh after /ai/chat success"
        )
        print("[patched] askAiChat dispatches AI usage refresh events")
    else:
        print("[skipped] askAiChat already dispatches AI usage refresh events")

    old_suggestion_return = """export async function getAiSuggestion() {
  const res = await client.get('/ai/suggestion');
  return res.data;
}
"""

    new_suggestion_return = """export async function getAiSuggestion() {
  const res = await client.get('/ai/suggestion');

  notifyAiUsageUpdated({ endpoint: '/ai/suggestion' });

  return res.data;
}
"""

    if "notifyAiUsageUpdated({ endpoint: '/ai/suggestion' });" not in updated:
        updated = replace_once(
            updated,
            old_suggestion_return,
            new_suggestion_return,
            "add AI usage refresh after /ai/suggestion success"
        )
        print("[patched] getAiSuggestion dispatches AI usage refresh events")
    else:
        print("[skipped] getAiSuggestion already dispatches AI usage refresh events")

    required_markers = [
        "function notifyAiUsageUpdated",
        "window.dispatchEvent(new CustomEvent('ai:usage-updated'",
        "window.dispatchEvent(new CustomEvent('subscription:refresh'",
        "window.dispatchEvent(new CustomEvent('subscription:changed'",
        "window.dispatchEvent(new CustomEvent('subscription-usage-updated'",
        "notifyAiUsageUpdated({ endpoint: '/ai/chat' });",
        "notifyAiUsageUpdated({ endpoint: '/ai/suggestion' });",
    ]

    for marker in required_markers:
        if marker not in updated:
            raise SystemExit(
                f"[patch_ai_usage_refresh_events] ERROR: verification failed, missing marker: {marker}"
            )

    TARGET.write_text(updated)

    print(f"[patch_ai_usage_refresh_events] backup created: {backup}")
    print("[patch_ai_usage_refresh_events] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "notifyAiUsageUpdated|ai:usage-updated|subscription:refresh|subscription:changed|subscription-usage-updated|askAiChat|getAiSuggestion" src/api/ai.js -C 6')
    print("  git diff -- src/api/ai.js")

if __name__ == "__main__":
    main()
