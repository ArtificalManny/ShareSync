from pathlib import Path

TARGET = Path("src/components/subscription/SubscriptionButton.jsx")

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"[patch_subscription_button_realtime_refresh] ERROR: {label}: expected 1, found {count}")
    return text.replace(old, new, 1)

def main():
    print("[patch_subscription_button_realtime_refresh] starting")

    if not TARGET.exists():
        raise SystemExit(f"[patch_subscription_button_realtime_refresh] ERROR: missing {TARGET}")

    text = TARGET.read_text()
    backup = TARGET.with_suffix(".jsx.bak.before-subscription-realtime-refresh")
    backup.write_text(text)

    old_effect = """  useEffect(() => {
    loadSubscription();
  }, []);
"""

    new_effect = """  useEffect(() => {
    loadSubscription();

    const refreshSubscriptionUsage = () => {
      loadSubscription();
    };

    window.addEventListener("subscription-usage-updated", refreshSubscriptionUsage);
    window.addEventListener("ai-usage-updated", refreshSubscriptionUsage);
    window.addEventListener("storage", refreshSubscriptionUsage);

    return () => {
      window.removeEventListener("subscription-usage-updated", refreshSubscriptionUsage);
      window.removeEventListener("ai-usage-updated", refreshSubscriptionUsage);
      window.removeEventListener("storage", refreshSubscriptionUsage);
    };
  }, []);
"""

    text = replace_once(
        text,
        old_effect,
        new_effect,
        "initial loadSubscription useEffect"
    )

    TARGET.write_text(text)

    print(f"[patch_subscription_button_realtime_refresh] backup created: {backup}")
    print("[patch_subscription_button_realtime_refresh] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "subscription-usage-updated|ai-usage-updated|loadSubscription" src/components/subscription/SubscriptionButton.jsx -C 8')
    print("  git diff -- src/components/subscription/SubscriptionButton.jsx")

if __name__ == "__main__":
    main()
