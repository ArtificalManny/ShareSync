#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/api/projects.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_projects_api_public_listing_payload] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_projects_api_public_listing_payload] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "function normalizeCreateProjectPayload(projectData = {}) {",
        "const privacyRaw = (projectData.privacy ?? '').toString().trim().toLowerCase();",
        "const isPublicRaw = projectData.isPublic;",
        "const tags = category ? [category] : undefined;",
        "const members = Array.isArray(projectData.members) ? projectData.members : undefined;",
        "return {",
        "name: title,",
        "description: description || undefined,",
        "visibility,",
        "tags,",
        "members,",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Replace the visibility calculation block with a broader public/listing contract.
    old_visibility_block = """  const privacyRaw = (projectData.privacy ?? '').toString().trim().toLowerCase();
  const isPublicRaw = projectData.isPublic;

  const visibility =
    typeof isPublicRaw === 'boolean'
      ? (isPublicRaw ? 'public' : 'private')
      : privacyRaw === 'public'
        ? 'public'
        : privacyRaw === 'private'
          ? 'private'
          : undefined;"""

    new_visibility_block = """  const privacyRaw = (projectData.privacy ?? '').toString().trim().toLowerCase();
  const visibilityRaw = (projectData.visibility ?? '').toString().trim().toLowerCase();
  const isPublicRaw = projectData.isPublic;

  const isProjectPublic =
    typeof isPublicRaw === 'boolean'
      ? isPublicRaw
      : visibilityRaw === 'public' ||
        visibilityRaw === 'listed' ||
        privacyRaw === 'public' ||
        privacyRaw === 'listed';

  const visibility = isProjectPublic ? 'public' : 'private';
  const isListed = isProjectPublic
    ? Boolean(projectData.isListed ?? projectData.discoverable ?? projectData.settings?.isListed)
    : false;

  const rawSpectatorMode = (
    projectData.publicAccessMode ??
    projectData.spectatorMode ??
    projectData.settings?.publicAccessMode ??
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  const publicAccessMode =
    !isProjectPublic
      ? 'none'
      : rawSpectatorMode === 'suggest' || rawSpectatorMode === 'suggestions'
        ? 'suggestions'
        : 'view_only';

  const suggestionsEnabled =
    isProjectPublic &&
    (publicAccessMode === 'suggestions' || projectData.suggestionsEnabled === true);"""

    if "const isProjectPublic =" not in source:
        if old_visibility_block not in source:
            fail("Could not find exact visibility block to replace.")
        source = source.replace(old_visibility_block, new_visibility_block, 1)
        print("[wire_projects_api_public_listing_payload] upgraded visibility/listing/spectator normalization")
    else:
        print("[wire_projects_api_public_listing_payload] visibility/listing/spectator normalization already present")

    # 2) Replace the return payload to preserve the public/discover/spectator fields.
    old_return_block = """  return {
    name: title,
    description: description || undefined,
    visibility,
    tags,
    emoji,
    icon,
    color,
    members,
  };"""

    new_return_block = """  return {
    name: title,
    title,
    description: description || undefined,
    category: category || undefined,

    // Privacy / publishing contract
    visibility,
    privacy: isProjectPublic ? 'Public' : 'Private',
    isPublic: isProjectPublic,

    // Discover/Search listing contract
    isListed,
    discoverable: isListed,

    // Spectator/public access contract
    spectatorMode: publicAccessMode,
    publicAccessMode,
    suggestionsEnabled,

    // Backend settings mirror
    settings: {
      ...(projectData.settings || {}),
      isPublic: isProjectPublic,
      isListed,
      publicAccessMode,
      spectatorMode: publicAccessMode,
      suggestionsEnabled,
    },

    tags,
    emoji,
    icon,
    color,
    members,
  };"""

    if "discoverable: isListed," not in source:
        if old_return_block not in source:
            fail("Could not find exact create payload return block to replace.")
        source = source.replace(old_return_block, new_return_block, 1)
        print("[wire_projects_api_public_listing_payload] preserved public listing fields in create payload")
    else:
        print("[wire_projects_api_public_listing_payload] create payload return already upgraded")

    required_after = [
        "const visibilityRaw = (projectData.visibility ?? '').toString().trim().toLowerCase();",
        "const isProjectPublic =",
        "const isListed = isProjectPublic",
        "const publicAccessMode =",
        "const suggestionsEnabled =",
        "privacy: isProjectPublic ? 'Public' : 'Private',",
        "isPublic: isProjectPublic,",
        "isListed,",
        "discoverable: isListed,",
        "spectatorMode: publicAccessMode,",
        "publicAccessMode,",
        "suggestionsEnabled,",
        "settings: {",
        "publicAccessMode,",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_projects_api_public_listing_payload] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-api-public-listing-payload-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_projects_api_public_listing_payload] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_projects_api_public_listing_payload] patched: {TARGET}")

    print("")
    print("[wire_projects_api_public_listing_payload] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"isProjectPublic|isListed|discoverable|spectatorMode|publicAccessMode|suggestionsEnabled|settings:\" src/api/projects.js -C 8")
    print("  git diff -- src/api/projects.js")


if __name__ == "__main__":
    main()
