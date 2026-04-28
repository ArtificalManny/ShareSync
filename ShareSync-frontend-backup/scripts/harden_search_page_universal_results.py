#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/Search.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_search_page_universal_results] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[harden_search_page_universal_results] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Search() {",
        "const initialQ = searchParams.get(\"q\") || \"\";",
        "const [results, setResults] = useState([]);",
        "const performSearch = async () => {",
        "searchAll({",
        "types: ['project', 'task'], // Exclude 'person' here so we don't get duplicates",
        "searchGlobalUsers(q) // Our new LinkedIn-style user search",
        "const userMapped = usersRes.value.map(u => ({",
        "url: `/profile/${u._id || u.id}`, // Route straight to profile!",
        "if (unifiedRes.status === 'fulfilled' && Array.isArray(unifiedRes.value)) {",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add normalization helpers after getPhoto().
    old_get_photo = """function getPhoto(u) {
  return u?.profilePicture || u?.avatarUrl || u?.avatar || null;
}"""

    new_get_photo = """function getPhoto(u) {
  return u?.profilePicture || u?.avatarUrl || u?.avatar || null;
}

function unwrapSearchArray(payload) {
  if (Array.isArray(payload)) return payload;

  const data = payload?.data ?? payload?.results ?? payload?.items ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.projects)) return data.projects;

  return [];
}

function normalizeSearchTypes(typesParam) {
  const raw = String(typesParam || "")
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  const allowed = new Set(["project", "task", "user", "person", "post", "file", "document", "message"]);

  const normalized = raw
    .filter((type) => allowed.has(type))
    .map((type) => (type === "user" ? "person" : type));

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : ["project", "task", "person", "post", "file"];
}

function getUserDisplayName(user) {
  return (
    user?.displayName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.name ||
    user?.username ||
    "User"
  );
}

function getUserProfileUrl(user) {
  const username = String(user?.username || "").trim();
  const id = String(user?._id || user?.id || user?.userId || "").trim();

  return username ? `/profile/${encodeURIComponent(username)}` : `/profile/${encodeURIComponent(id)}`;
}

function mapUserToSearchResult(user) {
  const id = String(user?._id || user?.id || user?.userId || user?.username || "").trim();
  const title = getUserDisplayName(user);

  if (!id) return null;

  return {
    id,
    type: "person",
    title,
    description: user?.username ? `@${user.username}` : "OpenShare profile",
    url: getUserProfileUrl(user),
    raw: user,
  };
}

function normalizeUnifiedResult(item) {
  if (!item || typeof item !== "object") return null;

  const rawType = String(item.type || item.kind || item.resultType || "").toLowerCase();
  const type = rawType === "user" ? "person" : rawType || "document";
  const id = String(item.id || item._id || item.projectId || item.taskId || item.fileId || item.postId || "").trim();

  if (!id && !item.url) return null;

  return {
    ...item,
    id: id || item.url,
    type,
    title: item.title || item.name || item.projectName || item.taskTitle || item.filename || "Untitled",
    description:
      item.description ||
      item.subtitle ||
      item.summary ||
      item.projectName ||
      item.status ||
      "",
    url:
      item.url ||
      item.href ||
      (type === "project" ? `/projects/${id}` : null) ||
      (type === "task" ? `/tasks/${id}` : null) ||
      (type === "file" ? `/files/${id}` : null) ||
      "/search",
    raw: item.raw || item,
  };
}

function dedupeSearchResults(results) {
  const seen = new Set();

  return results.filter((result) => {
    if (!result) return false;

    const key = `${result.type}:${result.id || result.url || result.title}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}"""

    if "function unwrapSearchArray(payload)" not in source:
        source = source.replace(old_get_photo, new_get_photo, 1)
        print("[harden_search_page_universal_results] inserted search normalization helpers")
    else:
        print("[harden_search_page_universal_results] search normalization helpers already present")

    # 2) Add URL type parsing after initialQ.
    old_initial_q = """  const initialQ = searchParams.get("q") || "";

  // Search state"""

    new_initial_q = """  const initialQ = searchParams.get("q") || "";
  const activeTypes = useMemo(
    () => normalizeSearchTypes(searchParams.get("types")),
    [searchParams]
  );

  // Search state"""

    if "const activeTypes = useMemo(" not in source:
        source = source.replace(old_initial_q, new_initial_q, 1)
        print("[harden_search_page_universal_results] added activeTypes from URL params")
    else:
        print("[harden_search_page_universal_results] activeTypes already present")

    # 3) Replace searchAll/searchGlobalUsers block.
    old_search_call = """        // ⭐ FIX: Run unified search & global user search in parallel!
        const [unifiedRes, usersRes] = await Promise.allSettled([
          searchAll({
            q,
            types: ['project', 'task'], // Exclude 'person' here so we don't get duplicates
            limit: 25,
          }),
          searchGlobalUsers(q) // Our new LinkedIn-style user search
        ]);

        if (!alive) return;

        let combined = [];

        // 1. Process users first (puts them at the top of the feed)
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          const userMapped = usersRes.value.map(u => ({
            id: u._id || u.id,
            type: 'person',
            title: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'User',
            description: `@${u.username || 'user'}`,
            url: `/profile/${u._id || u.id}`, // Route straight to profile!
            raw: u
          }));
          combined = [...combined, ...userMapped];
        }

        // 2. Process unified results (projects, tasks)
        if (unifiedRes.status === 'fulfilled' && Array.isArray(unifiedRes.value)) {
          let otherResults = unifiedRes.value;
          if (MODERATION_GATE_V1) {
            otherResults = otherResults.filter(isModerationApproved);
          }
          combined = [...combined, ...otherResults];
        }

        setResults(combined);"""

    new_search_call = """        const wantsPeople = activeTypes.includes("person");
        const unifiedTypes = activeTypes
          .filter((type) => type !== "person")
          .map((type) => (type === "document" ? "file" : type));

        // Run unified search and global user search in parallel.
        // Users are searched separately so same-name people remain distinct rows.
        const [unifiedRes, usersRes] = await Promise.allSettled([
          unifiedTypes.length > 0
            ? searchAll({
                q,
                types: unifiedTypes,
                limit: 30,
              })
            : Promise.resolve([]),
          wantsPeople ? searchGlobalUsers(q) : Promise.resolve([]),
        ]);

        if (!alive) return;

        let combined = [];

        // 1. Process users first so people appear at the top.
        if (usersRes.status === "fulfilled") {
          const users = unwrapSearchArray(usersRes.value);
          const userMapped = users.map(mapUserToSearchResult).filter(Boolean);
          combined = [...combined, ...userMapped];
        }

        // 2. Process unified results: projects, tasks, posts, files.
        if (unifiedRes.status === "fulfilled") {
          let otherResults = unwrapSearchArray(unifiedRes.value)
            .map(normalizeUnifiedResult)
            .filter(Boolean);

          if (MODERATION_GATE_V1) {
            otherResults = otherResults.filter(isModerationApproved);
          }

          combined = [...combined, ...otherResults];
        }

        setResults(dedupeSearchResults(combined));"""

    if "const wantsPeople = activeTypes.includes(\"person\");" not in source:
        if old_search_call not in source:
            fail("Could not find exact performSearch API block to replace.")
        source = source.replace(old_search_call, new_search_call, 1)
        print("[harden_search_page_universal_results] upgraded universal search execution")
    else:
        print("[harden_search_page_universal_results] universal search execution already upgraded")

    # 4) Update effect dependency to include activeTypes.
    old_dependency = "  }, [query]);"
    new_dependency = "  }, [query, activeTypes]);"

    if new_dependency not in source:
        source = source.replace(old_dependency, new_dependency, 1)
        print("[harden_search_page_universal_results] added activeTypes to search effect dependencies")
    else:
        print("[harden_search_page_universal_results] activeTypes dependency already present")

    # 5) Make user row slightly richer, preserving same UI.
    old_user_description = """          {user?.username && (
            <p className="text-xs text-text-tertiary truncate">@{user.username}</p>
          )}"""

    new_user_description = """          <p className="text-xs text-text-tertiary truncate">
            {user?.username ? `@${user.username}` : result.description || "OpenShare profile"}
          </p>"""

    if "{user?.username ? `@${user.username}` : result.description || \"OpenShare profile\"}" not in source:
        source = source.replace(old_user_description, new_user_description, 1)
        print("[harden_search_page_universal_results] improved user row subtitle fallback")
    else:
        print("[harden_search_page_universal_results] user row subtitle fallback already present")

    required_after = [
        "function unwrapSearchArray(payload)",
        "function normalizeSearchTypes(typesParam)",
        "function getUserDisplayName(user)",
        "function getUserProfileUrl(user)",
        "function mapUserToSearchResult(user)",
        "function normalizeUnifiedResult(item)",
        "function dedupeSearchResults(results)",
        "const activeTypes = useMemo(",
        "const wantsPeople = activeTypes.includes(\"person\");",
        "const unifiedTypes = activeTypes",
        "searchGlobalUsers(q) : Promise.resolve([])",
        "unwrapSearchArray(usersRes.value)",
        "users.map(mapUserToSearchResult).filter(Boolean)",
        "unwrapSearchArray(unifiedRes.value)",
        "setResults(dedupeSearchResults(combined));",
        "}, [query, activeTypes]);",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[harden_search_page_universal_results] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-universal-search-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_search_page_universal_results] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[harden_search_page_universal_results] patched: {TARGET}")

    print("")
    print("[harden_search_page_universal_results] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"unwrapSearchArray|normalizeSearchTypes|getUserDisplayName|getUserProfileUrl|mapUserToSearchResult|normalizeUnifiedResult|dedupeSearchResults|activeTypes|wantsPeople|unifiedTypes|searchGlobalUsers|searchAll\" src/pages/Search.jsx -C 8")
    print("  git diff -- src/pages/Search.jsx")


if __name__ == "__main__":
    main()
