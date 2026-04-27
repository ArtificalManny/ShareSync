#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/discovery/discovery.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_discovery_service_public_discoverable_filter] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_discovery_service_public_discoverable_filter] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class DiscoveryService {",
        "private readonly logger = new Logger(DiscoveryService.name);",
        "async calculateTrendingScores()",
        "async getPersonalizedFeed(userId: string, cursor?: string, limit = 10)",
        "async getDiscoveryFeed(query: any = {})",
        "async getTrendingProjects(limit = 10)",
        "async getDiscoverySections()",
        "private mapProjectToFeedItem(p: any)",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add reusable filter helper.
    helper_marker = "private getPublicDiscoverableProjectFilter()"
    old_logger = "  private readonly logger = new Logger(DiscoveryService.name);\n"
    helper = """  private readonly logger = new Logger(DiscoveryService.name);

  private getPublicDiscoverableProjectFilter() {
    return {
      $and: [
        {
          $or: [
            { visibility: 'public' },
            { visibility: 'listed' },
            { isPublic: true },
            { public: true },
            { 'settings.isPublic': true },
          ],
        },
        {
          $or: [
            { isListed: true },
            { discoverable: true },
            { listed: true },
            { 'settings.isListed': true },
            { 'settings.discoverable': true },
          ],
        },
        { status: { $ne: 'archived' } },
        { isArchived: { $ne: true } },
      ],
    };
  }
"""

    if helper_marker not in source:
        if old_logger not in source:
            fail("Could not find logger line to insert helper after.")
        source = source.replace(old_logger, helper, 1)
        print("[wire_discovery_service_public_discoverable_filter] inserted reusable public/discoverable filter")
    else:
        print("[wire_discovery_service_public_discoverable_filter] reusable filter already present")

    # 2) Patch calculateTrendingScores query.
    old_cron_query = """      const projects = await this.ProjectModel.find({
        $or: [{ visibility: 'public' }, { visibility: 'listed' }, { isPublic: true }, { 'settings.isListed': true }],
        status: { $ne: 'archived' },
        isArchived: { $ne: true },
      }).select('metrics followersCount createdAt updatedAt').lean();"""

    new_cron_query = """      const projects = await this.ProjectModel.find(
        this.getPublicDiscoverableProjectFilter(),
      ).select('metrics followersCount createdAt updatedAt').lean();"""

    if "this.ProjectModel.find(\n        this.getPublicDiscoverableProjectFilter(),\n      ).select('metrics followersCount createdAt updatedAt').lean();" not in source:
        if old_cron_query not in source:
            fail("Could not find calculateTrendingScores project query.")
        source = source.replace(old_cron_query, new_cron_query, 1)
        print("[wire_discovery_service_public_discoverable_filter] patched cron scoring filter")
    else:
        print("[wire_discovery_service_public_discoverable_filter] cron scoring filter already patched")

    # 3) Patch personalized feed filter block.
    old_personalized_filter = """    const filter: any = {
      $and: [
        {
          $or: [
            { visibility: 'public' }, { visibility: 'listed' },
            { isPublic: true }, { 'settings.isPublic': true }, { 'settings.isListed': true },
          ],
        },
        { status: { $ne: 'archived' } },
        { isArchived: { $ne: true } },
      ],
    };"""

    new_personalized_filter = """    const filter: any = this.getPublicDiscoverableProjectFilter();"""

    if "const filter: any = this.getPublicDiscoverableProjectFilter();" not in source:
        if old_personalized_filter not in source:
            fail("Could not find getPersonalizedFeed filter block.")
        source = source.replace(old_personalized_filter, new_personalized_filter, 1)
        print("[wire_discovery_service_public_discoverable_filter] patched personalized feed filter")
    else:
        print("[wire_discovery_service_public_discoverable_filter] personalized feed filter already patched")

    # 4) Patch standard discovery feed filter block.
    old_discovery_filter = """    const filter: any = {
      $and: [
        {
          $or: [
            { visibility: 'public' }, { visibility: 'listed' },
            { isPublic: true }, { public: true },
            { 'settings.isPublic': true }, { 'settings.isListed': true },
          ],
        },
        {
          $or: [
            { isListed: { $ne: false } }, { listed: { $ne: false } },
            { 'settings.isListed': { $ne: false } },
          ],
        },
        {
          $or: [ { status: { $ne: 'archived' } }, { isArchived: { $ne: true } } ],
        },
      ],
    };"""

    new_discovery_filter = """    const filter: any = this.getPublicDiscoverableProjectFilter();"""

    if source.count("const filter: any = this.getPublicDiscoverableProjectFilter();") < 2:
        if old_discovery_filter not in source:
            fail("Could not find getDiscoveryFeed filter block.")
        source = source.replace(old_discovery_filter, new_discovery_filter, 1)
        print("[wire_discovery_service_public_discoverable_filter] patched standard discovery feed filter")
    else:
        print("[wire_discovery_service_public_discoverable_filter] standard discovery feed filter already patched")

    # 5) Patch trending query.
    old_trending = """  async getTrendingProjects(limit = 10) {
    const docs = await this.ProjectModel.find({
      $or: [{ visibility: 'public' }, { visibility: 'listed' }, { isPublic: true }, { 'settings.isListed': true }],
      status: { $ne: 'archived' }, isArchived: { $ne: true },
    }).sort({ trendingScore: -1, 'metrics.weeklyShips': -1, 'metrics.memberCount': -1, updatedAt: -1 }).limit(limit).populate('ownerId', 'firstName lastName username avatarUrl').lean();
    return { success: true, data: (docs || []).map((p: any) => this.mapProjectToFeedItem(p)) };
  }"""

    new_trending = """  async getTrendingProjects(limit = 10) {
    const docs = await this.ProjectModel.find(
      this.getPublicDiscoverableProjectFilter(),
    ).sort({ trendingScore: -1, 'metrics.weeklyShips': -1, 'metrics.memberCount': -1, updatedAt: -1 }).limit(limit).populate('ownerId', 'firstName lastName username avatarUrl').lean();
    return { success: true, data: (docs || []).map((p: any) => this.mapProjectToFeedItem(p)) };
  }"""

    if "async getTrendingProjects(limit = 10) {\n    const docs = await this.ProjectModel.find(\n      this.getPublicDiscoverableProjectFilter()," not in source:
        if old_trending not in source:
            fail("Could not find getTrendingProjects block.")
        source = source.replace(old_trending, new_trending, 1)
        print("[wire_discovery_service_public_discoverable_filter] patched trending projects filter")
    else:
        print("[wire_discovery_service_public_discoverable_filter] trending projects filter already patched")

    # 6) Patch sections publicFilter.
    old_sections_filter = """    const publicFilter = {
      $or: [{ visibility: 'public' }, { visibility: 'listed' }, { isPublic: true }, { 'settings.isListed': true }],
      status: { $ne: 'archived' }, isArchived: { $ne: true },
    };"""

    new_sections_filter = """    const publicFilter = this.getPublicDiscoverableProjectFilter();"""

    if "const publicFilter = this.getPublicDiscoverableProjectFilter();" not in source:
        if old_sections_filter not in source:
            fail("Could not find getDiscoverySections publicFilter block.")
        source = source.replace(old_sections_filter, new_sections_filter, 1)
        print("[wire_discovery_service_public_discoverable_filter] patched discovery sections filter")
    else:
        print("[wire_discovery_service_public_discoverable_filter] discovery sections filter already patched")

    # 7) Preserve public/listed fields in mapProjectToFeedItem.
    old_map_tail = """      isFollowing: false, moderationStatus: 'approved',
      trendingScore: p.trendingScore // Expose to frontend
    };"""

    new_map_tail = """      isPublic: p.isPublic ?? p.public ?? p.settings?.isPublic ?? false,
      isListed: p.isListed ?? p.listed ?? p.settings?.isListed ?? false,
      discoverable: p.discoverable ?? p.settings?.discoverable ?? false,
      visibility: p.visibility,
      settings: p.settings,
      followersCount: Number(p.followersCount ?? 0),
      isFollowing: false, moderationStatus: 'approved',
      trendingScore: p.trendingScore // Expose to frontend
    };"""

    if "discoverable: p.discoverable ?? p.settings?.discoverable ?? false," not in source:
        if old_map_tail not in source:
            fail("Could not find mapProjectToFeedItem tail to extend.")
        source = source.replace(old_map_tail, new_map_tail, 1)
        print("[wire_discovery_service_public_discoverable_filter] preserved public/listed fields in feed items")
    else:
        print("[wire_discovery_service_public_discoverable_filter] feed item public/listed fields already present")

    required_after = [
        "private getPublicDiscoverableProjectFilter()",
        "{ 'settings.isPublic': true }",
        "{ 'settings.isListed': true }",
        "{ 'settings.discoverable': true }",
        "this.getPublicDiscoverableProjectFilter()",
        "const publicFilter = this.getPublicDiscoverableProjectFilter();",
        "isPublic: p.isPublic ?? p.public ?? p.settings?.isPublic ?? false,",
        "isListed: p.isListed ?? p.listed ?? p.settings?.isListed ?? false,",
        "discoverable: p.discoverable ?? p.settings?.discoverable ?? false,",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_discovery_service_public_discoverable_filter] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-discoverable-filter-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_discovery_service_public_discoverable_filter] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_discovery_service_public_discoverable_filter] patched: {TARGET}")

    print("")
    print("[wire_discovery_service_public_discoverable_filter] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getPublicDiscoverableProjectFilter|settings.isPublic|settings.isListed|settings.discoverable|getPersonalizedFeed|getDiscoveryFeed|getTrendingProjects|getDiscoverySections|discoverable:\" src/discovery/discovery.service.ts -C 8")
    print("  git diff -- src/discovery/discovery.service.ts")


if __name__ == "__main__":
    main()
