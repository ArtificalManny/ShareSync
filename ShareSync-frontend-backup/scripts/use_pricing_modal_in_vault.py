from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_VIEW = ROOT / "src/components/views/VaultView.jsx"
PRICING_MODAL = ROOT / "src/components/subscription/PricingModal.jsx"

def fail(message):
    print(f"\n[use_pricing_modal_in_vault] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[use_pricing_modal_in_vault] starting")

    if not VAULT_VIEW.exists():
        fail(f"Could not find {VAULT_VIEW}")

    if not PRICING_MODAL.exists():
        fail(
            f"Could not find {PRICING_MODAL}. "
            "Please confirm the PricingModal.jsx path before patching VaultView.jsx."
        )

    source = VAULT_VIEW.read_text(encoding="utf-8")
    original = source

    old_import = "import UpgradeStorageModal from '../vault/UpgradeStorageModal';"
    new_import = "import PricingModal from '../subscription/PricingModal';"

    if old_import in source:
        source = source.replace(old_import, new_import, 1)
        print("[use_pricing_modal_in_vault] replaced UpgradeStorageModal import with PricingModal import")
    elif new_import in source:
        print("[use_pricing_modal_in_vault] PricingModal import already present")
    else:
        fail(
            "Could not find the UpgradeStorageModal import anchor. "
            "No changes were written."
        )

    old_render = """      <UpgradeStorageModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />"""

    new_render = """      <PricingModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />"""

    if old_render in source:
        source = source.replace(old_render, new_render, 1)
        print("[use_pricing_modal_in_vault] replaced UpgradeStorageModal render with PricingModal render")
    elif new_render in source:
        print("[use_pricing_modal_in_vault] PricingModal render already present")
    else:
        fail(
            "Could not find the UpgradeStorageModal render block. "
            "No changes were written."
        )

    if "UpgradeStorageModal" in source:
        fail(
            "Safety check failed: UpgradeStorageModal still appears in VaultView.jsx. "
            "No changes were written."
        )

    if "PricingModal" not in source:
        fail(
            "Safety check failed: PricingModal was not inserted. "
            "No changes were written."
        )

    if source == original:
        print("[use_pricing_modal_in_vault] VaultView.jsx already up to date")
        return

    backup = VAULT_VIEW.with_suffix(VAULT_VIEW.suffix + ".bak-use-pricing-modal")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[use_pricing_modal_in_vault] backup created: {backup}")

    VAULT_VIEW.write_text(source, encoding="utf-8")
    print(f"[use_pricing_modal_in_vault] patched: {VAULT_VIEW}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"PricingModal|UpgradeStorageModal|setIsUpgradeModalOpen|Upgrade Plan\" src/components/views/VaultView.jsx src/components/subscription/PricingModal.jsx")

if __name__ == "__main__":
    main()
