#!/usr/bin/env python3
"""
Fix global discovery search to find public projects on explicit query.

Bug: getDiscoveryFeed() always uses getPublicDiscoverableProjectFilter(),
which requires BOTH visibility=public AND a separate isListed/discoverable
flag. Projects that are 'public' but haven't opted into the listed feed
(like Snicker's bar) cannot be found even by exact name search.

Fix: When the user provides a search query (q), use a relaxed filter that
only requires public visibility + not-archived. The strict listed-only
filter remains for browse/trending mode (no query).

Behavior:
  - GET /api/discovery (no q)        → strict (must be listed) — UNCHANGED
  - GET /api/discovery?q=Snicker     → relaxed (any public, non-archived)
  - GET /api/discovery?sort=trending → strict — UNCHANGED
  - getTrendingProjects()            → strict — UNCHANGED

Scope: One file, one anchored str.replace, automatic backup.
"""

import sys
from pathlib import Path

PATH = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend/src/discovery/discovery.service.ts")

src = PATH.read_text(encoding="utf-8")

# Anchor on the discovery feed setup. We keep everything identical except
# we choose the filter based on whether q is present.
OLD = """    const q = (query.q ?? '').toString().trim();
    const sort = (query.sort ?? 'trending').toString(); // Default to algorithmic
    const category = (query.category ?? '').toString().trim();

    const filter: any = this.getPublicDiscoverableProjectFilter();

    if (category) filter.$and.push({ category: { $regex: category, $options: 'i' } });
    if (q) filter.$and.push({
      $or: [
        { title: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }, { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    });"""

NEW = """    const q = (query.q ?? '').toString().trim();
    const sort = (query.sort ?? 'trending').toString(); // Default to algorithmic
    const category = (query.category ?? '').toString().trim();

    // When the user provides an explicit search query, honor their intent:
    // return any public, non-archived project matching the query — even if
    // the owner hasn't toggled isListed/discoverable. Browse/trending mode
    // (no query) keeps the strict listed-only filter.
    const filter: any = q
      ? this.getPublicSearchableProjectFilter()
      : this.getPublicDiscoverableProjectFilter();

    if (category) filter.$and.push({ category: { $regex: category, $options: 'i' } });
    if (q) filter.$and.push({
      $or: [
        { title: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }, { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    });"""

if src.count(OLD) != 1:
    print(f"ERROR: anchor found {src.count(OLD)} times. Expected exactly 1.", file=sys.stderr)
    sys.exit(1)

# Now add the new helper method right after getPublicDiscoverableProjectFilter.
# Anchor on the closing brace of getPublicDiscoverableProjectFilter (the one
# that closes the return + method body), followed by the constructor.
HELPER_OLD = """  private getPublicDiscoverableProjectFilter() {
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
  constructor("""

HELPER_NEW = """  private getPublicDiscoverableProjectFilter() {
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

  // Relaxed filter for explicit text search: any public, non-archived
  // project matches. Used by getDiscoveryFeed when q is provided so users
  // can find public projects they've named, even if the owner hasn't
  // opted into the listed/discoverable feed.
  private getPublicSearchableProjectFilter() {
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
        { status: { $ne: 'archived' } },
        { isArchived: { $ne: true } },
      ],
    };
  }

  constructor("""

if src.count(HELPER_OLD) != 1:
    print(f"ERROR: helper anchor found {src.count(HELPER_OLD)} times. Expected exactly 1.", file=sys.stderr)
    sys.exit(1)

# Backup before mutation
backup = PATH.with_suffix(PATH.suffix + ".bak.before-search-filter")
backup.write_text(src, encoding="utf-8")
print(f"Backup written to: {backup}")

new_src = src
new_src = new_src.replace(OLD, NEW, 1)
new_src = new_src.replace(HELPER_OLD, HELPER_NEW, 1)

# Post-edit verification
checks = [
    ("? this.getPublicSearchableProjectFilter()", 1),
    ("private getPublicSearchableProjectFilter()", 1),
    ("private getPublicDiscoverableProjectFilter()", 1),  # original still exists
]

for marker, expected_count in checks:
    actual = new_src.count(marker)
    if actual != expected_count:
        print(f"ERROR: marker '{marker}' appears {actual} times. Expected {expected_count}.", file=sys.stderr)
        sys.exit(1)

PATH.write_text(new_src, encoding="utf-8")
print("✓ Discovery search filter fix applied.")
print()
print("Behavior change:")
print("  - GET /api/discovery (browse, no q)         → strict filter UNCHANGED")
print("  - GET /api/discovery?q=Snicker (search)     → relaxed: any public + not archived")
print("  - getTrendingProjects() and other browses   → strict UNCHANGED")
print()
print("To verify: curl 'http://localhost:5050/api/discovery?q=Snicker&limit=10'")
print("Expected: data: [Snicker's bar]")
print()
print("Recovery if needed:")
print(f"  cp {backup} {PATH}")
