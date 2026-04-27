#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/ProjectsCreate.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_projects_create_public_listing_payload] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_projects_create_public_listing_payload] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        'const [privacy, setPrivacy] = useState("Private");',
        'const [isListed, setIsListed] = useState(false);',
        'const [spectatorMode, setSpectatorMode] = useState("view");',
        'savePhase0Prefs({',
        'const payload = {',
        'privacy,',
        'isPublic: privacy === "Public",',
        'members,',
        '<span className="text-xs text-slate-500">(Phase 0: UI-only)</span>',
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Insert explicit public-create derived values right before savePhase0Prefs().
    old_before_prefs = """      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      savePhase0Prefs({"""

    new_before_prefs = """      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const isProjectPublic = privacy === "Public";
      const normalizedSpectatorMode =
        spectatorMode === "suggest" ? "suggestions" : "view_only";

      savePhase0Prefs({"""

    if "const isProjectPublic = privacy === \"Public\";" not in source:
        if old_before_prefs not in source:
            fail("Could not find insertion point before savePhase0Prefs.")
        source = source.replace(old_before_prefs, new_before_prefs, 1)
        print("[wire_projects_create_public_listing_payload] inserted public/spectator derived values")
    else:
        print("[wire_projects_create_public_listing_payload] derived values already present")

    # 2) Replace payload block with backwards-compatible public listing contract.
    old_payload = """      const payload = {
        name: trimmedTitle,
        title: trimmedTitle,
        description: trimmedDescription,
        category: category.trim() || undefined,
        status,
        privacy,
        isPublic: privacy === "Public",
        members,
      };"""

    new_payload = """      const payload = {
        name: trimmedTitle,
        title: trimmedTitle,
        description: trimmedDescription,
        category: category.trim() || undefined,
        status,

        // Privacy / publishing contract
        // Keep legacy frontend fields while also sending backend-friendly fields.
        privacy,
        visibility: isProjectPublic ? "public" : "private",
        isPublic: isProjectPublic,

        // Discover/Search listing contract
        // Listed only matters for public projects. Private projects must never leak into Discover.
        isListed: isProjectPublic ? Boolean(isListed) : false,
        discoverable: isProjectPublic ? Boolean(isListed) : false,

        // Spectator/public access contract
        // view_only: public viewers can watch only
        // suggestions: public viewers can submit moderated suggestions later
        spectatorMode: isProjectPublic ? normalizedSpectatorMode : "none",
        publicAccessMode: isProjectPublic ? normalizedSpectatorMode : "none",
        suggestionsEnabled: isProjectPublic && normalizedSpectatorMode === "suggestions",

        members,
      };"""

    if "publicAccessMode: isProjectPublic ? normalizedSpectatorMode : \"none\"," not in source:
        if old_payload not in source:
            fail("Could not find exact payload block to replace.")
        source = source.replace(old_payload, new_payload, 1)
        print("[wire_projects_create_public_listing_payload] upgraded createProject payload")
    else:
        print("[wire_projects_create_public_listing_payload] payload already upgraded")

    # 3) Update UI copy from "Phase 0: UI-only" to signal real saved fields.
    old_phase_label = '<span className="text-xs text-slate-500">(Phase 0: UI-only)</span>'
    new_phase_label = '<span className="text-xs text-slate-500">(Saved with project)</span>'

    if old_phase_label in source:
        source = source.replace(old_phase_label, new_phase_label, 1)
        print("[wire_projects_create_public_listing_payload] updated public visibility label")
    elif new_phase_label in source:
        print("[wire_projects_create_public_listing_payload] public visibility label already updated")
    else:
        fail("Could not find public visibility phase label.")

    # Safety checks.
    required_after = [
        'const isProjectPublic = privacy === "Public";',
        'const normalizedSpectatorMode =',
        'visibility: isProjectPublic ? "public" : "private",',
        'isListed: isProjectPublic ? Boolean(isListed) : false,',
        'discoverable: isProjectPublic ? Boolean(isListed) : false,',
        'spectatorMode: isProjectPublic ? normalizedSpectatorMode : "none",',
        'publicAccessMode: isProjectPublic ? normalizedSpectatorMode : "none",',
        'suggestionsEnabled: isProjectPublic && normalizedSpectatorMode === "suggestions",',
        '(Saved with project)',
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_projects_create_public_listing_payload] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-listing-payload-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_projects_create_public_listing_payload] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_projects_create_public_listing_payload] patched: {TARGET}")

    print("")
    print("[wire_projects_create_public_listing_payload] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"isProjectPublic|normalizedSpectatorMode|visibility:|isListed:|discoverable:|spectatorMode:|publicAccessMode:|suggestionsEnabled|Saved with project\" src/pages/ProjectsCreate.jsx -C 6")
    print("  git diff -- src/pages/ProjectsCreate.jsx")


if __name__ == "__main__":
    main()
