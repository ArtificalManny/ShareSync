from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"

def fail(message):
    print(f"\n[fix_vault_pricing_modal_mount] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[fix_vault_pricing_modal_mount] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    # This is the version that causes trouble if PricingModal ignores isOpen internally.
    always_mounted_pricing = """      <PricingModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />"""

    conditionally_mounted_pricing = """      {isUpgradeModalOpen ? (
        <PricingModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      ) : null}"""

    # If your file still has the older storage modal, this leaves it alone.
    # This script is only for the PricingModal version.
    if conditionally_mounted_pricing in source:
        print("[fix_vault_pricing_modal_mount] PricingModal is already conditionally mounted")
        return

    if always_mounted_pricing not in source:
        fail(
            "Could not find the always-mounted PricingModal block. "
            "No changes were written. Run: rg -n \"PricingModal|UpgradeStorageModal\" src/components/views/VaultView.jsx"
        )

    source = source.replace(always_mounted_pricing, conditionally_mounted_pricing, 1)

    if "onClick={() => setIsUpgradeModalOpen(true)}" not in source:
        fail(
            "Safety check failed: Upgrade Plan trigger was not found. "
            "No changes were written."
        )

    if source == original:
        print("[fix_vault_pricing_modal_mount] no changes needed")
        return

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-pricing-modal-conditional-mount")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[fix_vault_pricing_modal_mount] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[fix_vault_pricing_modal_mount] patched: {VAULT_VIEW}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"PricingModal|UpgradeStorageModal|setIsUpgradeModalOpen|Upgrade Plan\" src/components/views/VaultView.jsx")
    print("  git diff -- src/components/views/VaultView.jsx")

if __name__ == "__main__":
    main()
