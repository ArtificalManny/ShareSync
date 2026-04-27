#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/api/discovery.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_discovery_api_public_filter] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_discovery_api_public_filter] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        'import client from "./client";',
        "export async function getDiscoveryFeed(params = {}) {",
        "export async function getAlgorithmicFeed({ cursor, limit = 10 } = {}) {",
        "const rawItems = payload?.items || [];",
        "const activities = rawItems.map((p) => {",
        "function normalizeProjectItem(item) {",
        "export async function getDiscoverySections(params = {}) {",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add shared public/listed helpers after import.
    old_import = 'import client from "./client";\n'
    helper_block = '''import client from "./client";

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true" || lowered === "yes" || lowered === "1") return true;
    if (lowered === "false" || lowered === "no" || lowered === "0") return false;
  }
  return Boolean(value);
}

function unwrapArrayResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function unwrapFeedResponse(payload) {
  const data = payload?.items
    ? payload
    : payload?.data?.items
      ? payload.data
      : payload?.data || payload || {};

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor || data?.cursor || null,
  };
}

function isPublicDiscoverableProject(item) {
  if (!item || typeof item !== "object") return false;

  const settings = item.settings || {};
  const visibility = String(item.visibility || item.privacy || "").trim().toLowerCase();

  const isPublic =
    item.isPublic === true ||
    settings.isPublic === true ||
    item.public === true ||
    visibility === "public" ||
    visibility === "listed";

  const isListed =
    item.isListed === true ||
    item.discoverable === true ||
    settings.isListed === true ||
    settings.discoverable === true ||
    normalizeBoolean(item.isListed) ||
    normalizeBoolean(item.discoverable);

  return isPublic && isListed;
}

function getProjectId(item) {
  return String(item?._id || item?.id || item?.projectId || "").trim();
}
'''

    if "function isPublicDiscoverableProject(item)" not in source:
        source = source.replace(old_import, helper_block, 1)
        print("[wire_discovery_api_public_filter] inserted public/listed discovery helpers")
    else:
        print("[wire_discovery_api_public_filter] public/listed discovery helpers already present")

    # 2) Patch getDiscoveryFeed so it returns only public + listed/discoverable projects.
    old_get_discovery_feed = '''export async function getDiscoveryFeed(params = {}) {
  try {
    const { signal, ...rest } = params || {};
    const res = await client.get("/discovery", { params: rest, signal });
    return Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.items) ? res.data.items : [];
  } catch {
    return [];
  }
}'''

    new_get_discovery_feed = '''export async function getDiscoveryFeed(params = {}) {
  try {
    const { signal, ...rest } = params || {};
    const res = await client.get("/discovery", { params: rest, signal });
    const items = unwrapArrayResponse(res?.data);
    return items.filter(isPublicDiscoverableProject);
  } catch (err) {
    console.error("[discovery] getDiscoveryFeed failed:", err);
    return [];
  }
}'''

    if "return items.filter(isPublicDiscoverableProject);" not in source:
        if old_get_discovery_feed not in source:
            fail("Could not find exact getDiscoveryFeed block to replace.")
        source = source.replace(old_get_discovery_feed, new_get_discovery_feed, 1)
        print("[wire_discovery_api_public_filter] patched getDiscoveryFeed public/listed filter")
    else:
        print("[wire_discovery_api_public_filter] getDiscoveryFeed already patched")

    # 3) Patch algorithmic feed raw item extraction/filtering.
    old_payload_block = '''    const payload = res?.data?.items ? res.data : res?.data?.data;
    const rawItems = payload?.items || [];
    const nextCursor = payload?.nextCursor || null;

    const activities = rawItems.map((p) => {
      const hash = p.id.charCodeAt(0) % 4;'''

    new_payload_block = '''    const payload = unwrapFeedResponse(res?.data);
    const rawItems = payload.items.filter(isPublicDiscoverableProject);
    const nextCursor = payload.nextCursor;

    const activities = rawItems.map((p) => {
      const id = getProjectId(p);
      const hash = (id.charCodeAt(0) || 0) % 4;'''

    if "const rawItems = payload.items.filter(isPublicDiscoverableProject);" not in source:
        if old_payload_block not in source:
            fail("Could not find exact algorithmic feed payload block to replace.")
        source = source.replace(old_payload_block, new_payload_block, 1)
        print("[wire_discovery_api_public_filter] patched getAlgorithmicFeed public/listed filter")
    else:
        print("[wire_discovery_api_public_filter] getAlgorithmicFeed already patched")

    # 4) Patch algorithmic activity ID and project-name fallbacks.
    old_activity_return = '''      return {
        id: `feed-item-${p.id}`,
        type: 'ship',
        user: p.ownerInfo?.username || p.ownerInfo?.firstName || p.teamName || 'A creator',
        action: actions[hash],
        content: p.lastShip || p.description || 'working hard on the vision',
        project: p.projectName,
        timestamp: p.lastActivity || 'recently',
        icon: icons[hash],
        color: colors[hash],
        rawScore: p.algorithmicScore
      };'''

    new_activity_return = '''      return {
        id: `feed-item-${id}`,
        projectId: id,
        type: 'ship',
        user: p.ownerInfo?.username || p.ownerInfo?.firstName || p.teamName || 'A creator',
        action: actions[hash],
        content: p.lastShip || p.description || 'working hard on the vision',
        project: p.projectName || p.name || p.title || 'Untitled Project',
        timestamp: p.lastActivity || p.lastActivityAt || 'recently',
        icon: icons[hash],
        color: colors[hash],
        rawScore: p.algorithmicScore
      };'''

    if "projectId: id," not in source:
        if old_activity_return not in source:
            fail("Could not find exact algorithmic activity return block to replace.")
        source = source.replace(old_activity_return, new_activity_return, 1)
        print("[wire_discovery_api_public_filter] strengthened algorithmic activity mapping")
    else:
        print("[wire_discovery_api_public_filter] algorithmic activity mapping already strengthened")

    # 5) Patch normalizeProjectItem so section output carries public/listed fields forward.
    old_project_return_piece = '''    project: { id, projectName, teamName, emoji, streak, members, lastShip, totalShips, completionRate, lastActivity, lastActivityDays, tags: Array.isArray(item?.tags) ? item.tags : [], moderationStatus: item?.moderationStatus },'''

    new_project_return_piece = '''    project: {
      id,
      projectName,
      teamName,
      emoji,
      streak,
      members,
      lastShip,
      totalShips,
      completionRate,
      lastActivity,
      lastActivityDays,
      tags: Array.isArray(item?.tags) ? item.tags : [],
      moderationStatus: item?.moderationStatus,
      isPublic: item?.isPublic ?? item?.settings?.isPublic ?? item?.public,
      isListed: item?.isListed ?? item?.settings?.isListed,
      discoverable: item?.discoverable ?? item?.settings?.discoverable,
      visibility: item?.visibility,
      settings: item?.settings,
    },'''

    if "project: {\n      id," not in source:
        if old_project_return_piece not in source:
            fail("Could not find normalizeProjectItem project return piece.")
        source = source.replace(old_project_return_piece, new_project_return_piece, 1)
        print("[wire_discovery_api_public_filter] preserved public/listed fields in normalized sections")
    else:
        print("[wire_discovery_api_public_filter] normalized sections already preserve public/listed fields")

    required_after = [
        "function isPublicDiscoverableProject(item)",
        "function unwrapArrayResponse(payload)",
        "function unwrapFeedResponse(payload)",
        "return items.filter(isPublicDiscoverableProject);",
        "const rawItems = payload.items.filter(isPublicDiscoverableProject);",
        "projectId: id,",
        "project: p.projectName || p.name || p.title || 'Untitled Project'",
        "isPublic: item?.isPublic ?? item?.settings?.isPublic ?? item?.public",
        "discoverable: item?.discoverable ?? item?.settings?.discoverable",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_discovery_api_public_filter] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-discover-api-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_discovery_api_public_filter] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_discovery_api_public_filter] patched: {TARGET}")

    print("")
    print("[wire_discovery_api_public_filter] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"isPublicDiscoverableProject|unwrapArrayResponse|unwrapFeedResponse|rawItems = payload.items.filter|projectId: id|discoverable|isListed|getDiscoveryFeed|getAlgorithmicFeed\" src/api/discovery.js -C 8")
    print("  git diff -- src/api/discovery.js")


if __name__ == "__main__":
    main()
