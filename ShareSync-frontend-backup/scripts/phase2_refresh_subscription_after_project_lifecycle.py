from pathlib import Path
from datetime import datetime
import sys

TARGET = Path("src/pages/ProjectHome.jsx")

def fail(message):
    print(f"[phase2_refresh_subscription_after_project_lifecycle] ERROR: {message}")
    sys.exit(1)

def main():
    print("[phase2_refresh_subscription_after_project_lifecycle] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()
    original = text

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-phase2-lifecycle-subscription-refresh-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original)

    helper = """
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT LIFECYCLE SUBSCRIPTION REFRESH BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// Completing a project should release one active-project slot.
// Reopening a completed project should consume one active-project slot again.
// SubscriptionButton already listens for these events and reloads /subscriptions/current.
function notifyProjectLifecycleSubscriptionRefresh(detail = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    resource: "projects",
    source: "ProjectHome",
    timestamp: Date.now(),
    ...detail,
  };

  window.dispatchEvent(new CustomEvent("project:lifecycle-updated", { detail: payload }));
  window.dispatchEvent(new CustomEvent("subscription:refresh", { detail: payload }));
  window.dispatchEvent(new CustomEvent("subscription:changed", { detail: payload }));
  window.dispatchEvent(new CustomEvent("subscription-usage-updated", { detail: payload }));
}
"""

    if "PROJECT LIFECYCLE SUBSCRIPTION REFRESH BRIDGE" not in text:
        marker = "const SuggestionsPanel ="
        if marker not in text:
            fail("could not find SuggestionsPanel marker for helper insertion")
        text = text.replace(marker, helper + "\n" + marker, 1)
        print("[patched] inserted lifecycle subscription refresh helper")
    else:
        print("[skip] lifecycle subscription refresh helper already present")

    old_complete = """        await completeProject(id, payload);
        setShowCompleteProjectModal(false);
        await forceLifecycleRefresh();"""

    new_complete = """        await completeProject(id, payload);
        notifyProjectLifecycleSubscriptionRefresh({
          projectId: id,
          action: "completed",
        });
        setShowCompleteProjectModal(false);
        await forceLifecycleRefresh();"""

    if new_complete in text:
        print("[skip] completeProject handler already dispatches subscription refresh")
    elif old_complete in text:
        text = text.replace(old_complete, new_complete, 1)
        print("[patched] completeProject handler now dispatches subscription refresh")
    else:
        fail("could not find completeProject handler block")

    old_reopen = """        await reopenProject(id, { reason: "Reopened from ProjectHome finish line" });
        await forceLifecycleRefresh();"""

    new_reopen = """        await reopenProject(id, { reason: "Reopened from ProjectHome finish line" });
        notifyProjectLifecycleSubscriptionRefresh({
          projectId: id,
          action: "reopened",
        });
        await forceLifecycleRefresh();"""

    if new_reopen in text:
        print("[skip] reopenProject handler already dispatches subscription refresh")
    elif old_reopen in text:
        text = text.replace(old_reopen, new_reopen, 1)
        print("[patched] reopenProject handler now dispatches subscription refresh")
    else:
        fail("could not find reopenProject handler block")

    TARGET.write_text(text)

    updated = TARGET.read_text()
    required = [
        "PROJECT LIFECYCLE SUBSCRIPTION REFRESH BRIDGE",
        "notifyProjectLifecycleSubscriptionRefresh",
        'action: "completed"',
        'action: "reopened"',
        'window.dispatchEvent(new CustomEvent("subscription:refresh"',
        'window.dispatchEvent(new CustomEvent("subscription:changed"',
        'window.dispatchEvent(new CustomEvent("subscription-usage-updated"',
    ]

    for needle in required:
        if needle not in updated:
            fail(f"missing expected marker after patch: {needle}")

    print(f"[phase2_refresh_subscription_after_project_lifecycle] backup created: {backup}")
    print("[phase2_refresh_subscription_after_project_lifecycle] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT LIFECYCLE SUBSCRIPTION REFRESH BRIDGE|notifyProjectLifecycleSubscriptionRefresh|subscription:refresh|subscription:changed|subscription-usage-updated|action: \\"completed\\"|action: \\"reopened\\"" src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/ProjectHome.jsx")

if __name__ == "__main__":
    main()
