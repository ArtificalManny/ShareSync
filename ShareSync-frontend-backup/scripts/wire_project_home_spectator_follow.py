#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/pages/ProjectHome.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_project_home_spectator_follow] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_project_home_spectator_follow] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        'import { completeProject, reopenProject } from "../api/projects";',
        'RotateCcw,',
        'function humanizeEnum(value) {',
        'function ProjectHeader({',
        'onMembersClick,',
        'isLifecycleBusy = false,',
        '<span>Members</span>',
        'const [isStartingSprint, setIsStartingSprint] = useState(false);',
        '} = useProjectOverview(id);',
        '<ProjectHeader',
        'isLifecycleBusy={isCompletingProject || isReopeningProject}',
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Imports.
    old_project_import = 'import { completeProject, reopenProject } from "../api/projects";'
    new_project_import = '''import { completeProject, reopenProject } from "../api/projects";
import { getFollowStatus } from "../api/follows";
import useFollow from "../hooks/useFollow";'''

    if 'import useFollow from "../hooks/useFollow";' not in source:
        source = source.replace(old_project_import, new_project_import, 1)
        print("[wire_project_home_spectator_follow] added follow imports")
    else:
        print("[wire_project_home_spectator_follow] follow imports already present")

    # 2) Add icons.
    old_icon_tail = '''  Flag,
  RotateCcw,
} from "lucide-react";'''

    new_icon_tail = '''  Flag,
  RotateCcw,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";'''

    if "BellOff," not in source:
        source = source.replace(old_icon_tail, new_icon_tail, 1)
        print("[wire_project_home_spectator_follow] added follow icons")
    else:
        print("[wire_project_home_spectator_follow] follow icons already present")

    # 3) Add spectator/access helpers after humanizeEnum.
    old_humanize = '''function humanizeEnum(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\\b\\w/g, (m) => m.toUpperCase());
}'''

    helpers = '''function humanizeEnum(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\\b\\w/g, (m) => m.toUpperCase());
}

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value?._id || value?.id || value?.userId || value?.toString?.() || "").trim();
  }
  return String(value).trim();
}

function getCurrentUserIds(user) {
  return new Set(
    [
      user?._id,
      user?.id,
      user?.userId,
      user?.sub,
    ]
      .map(normalizeId)
      .filter(Boolean)
  );
}

function getProjectOwnerIds(project) {
  return [
    project?.ownerId,
    project?.owner,
    project?.createdBy,
    project?.createdById,
  ]
    .map(normalizeId)
    .filter(Boolean);
}

function getProjectMemberIds(project) {
  const members = Array.isArray(project?.members) ? project.members : [];

  return members
    .map((member) =>
      normalizeId(
        member?.userId ||
          member?.user ||
          member?._id ||
          member?.id ||
          member
      )
    )
    .filter(Boolean);
}

function isProjectPubliclyViewable(project) {
  const visibility = String(project?.visibility || project?.privacy || "").toLowerCase();
  const settings = project?.settings || {};

  return (
    visibility === "public" ||
    visibility === "listed" ||
    project?.isPublic === true ||
    project?.public === true ||
    settings?.isPublic === true
  );
}

function getProjectPublicAccessMode(project) {
  const settings = project?.settings || {};
  const raw = String(
    project?.publicAccessMode ||
      project?.spectatorMode ||
      settings?.publicAccessMode ||
      settings?.spectatorMode ||
      ""
  ).toLowerCase();

  if (raw === "suggest" || raw === "suggestions") return "suggestions";
  if (raw === "view" || raw === "view_only") return "view_only";
  return isProjectPubliclyViewable(project) ? "view_only" : "none";
}

function getProjectViewerAccess(project, user) {
  const currentUserIds = getCurrentUserIds(user);
  const isLoggedIn = currentUserIds.size > 0;
  const isPublic = isProjectPubliclyViewable(project);

  const ownerIds = getProjectOwnerIds(project);
  const memberIds = getProjectMemberIds(project);

  const isOwner = ownerIds.some((id) => currentUserIds.has(id));
  const isMember = isOwner || memberIds.some((id) => currentUserIds.has(id));
  const publicAccessMode = getProjectPublicAccessMode(project);
  const suggestionsEnabled =
    publicAccessMode === "suggestions" ||
    project?.suggestionsEnabled === true ||
    project?.settings?.suggestionsEnabled === true;

  const isSpectator = Boolean(project && isPublic && !isMember);
  const showFollowButton = Boolean(project && isLoggedIn && isSpectator);

  return {
    isLoggedIn,
    isPublic,
    isOwner,
    isMember,
    isSpectator,
    isReadOnlySpectator: isSpectator && publicAccessMode !== "suggestions",
    canSuggest: isSpectator && suggestionsEnabled,
    canUseMemberActions: !isSpectator,
    showFollowButton,
    publicAccessMode,
    suggestionsEnabled,
  };
}'''

    if "function getProjectViewerAccess(project, user)" not in source:
        source = source.replace(old_humanize, helpers, 1)
        print("[wire_project_home_spectator_follow] inserted viewer access helpers")
    else:
        print("[wire_project_home_spectator_follow] viewer access helpers already present")

    # 4) Add SpectatorAccessBanner before ProjectHeader.
    banner = '''
function SpectatorAccessBanner({ viewerAccess, following, followersCount }) {
  if (!viewerAccess?.isSpectator) return null;

  return (
    <section className="mx-10 mt-6 rounded-[24px] border border-violet-200 dark:border-violet-500/20 bg-white dark:bg-[#111113] shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-5 md:px-6 py-4 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-violet-500/[0.03] dark:to-cyan-500/[0.06]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                <Eye className="w-3.5 h-3.5" />
                Public Spectator Mode
              </span>

              {following ? (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                  <Bell className="w-3.5 h-3.5" />
                  Following
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              You are viewing this public project as a spectator. Members can edit and ship work;
              spectators can follow updates{viewerAccess.canSuggest ? " and submit suggestions when enabled." : "."}
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-400 shrink-0">
            {Number(followersCount || 0)} follower{Number(followersCount || 0) === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </section>
  );
}

'''

    if "function SpectatorAccessBanner" not in source:
        source = source.replace(
            "// ═══════════════════════════════════════════════════════════════════════════════\n// PROJECT HEADER\n",
            banner + "// ═══════════════════════════════════════════════════════════════════════════════\n// PROJECT HEADER\n",
            1,
        )
        print("[wire_project_home_spectator_follow] inserted spectator banner")
    else:
        print("[wire_project_home_spectator_follow] spectator banner already present")

    # 5) Extend ProjectHeader props.
    old_header_props = '''  onMembersClick,
  onLifecycleAction,
  isLifecycleBusy = false,
}) {'''

    new_header_props = '''  onMembersClick,
  onLifecycleAction,
  isLifecycleBusy = false,
  viewerAccess,
  following = false,
  followLoading = false,
  followersCount = 0,
  onFollowToggle,
}) {'''

    if "viewerAccess," not in source.split("function ProjectHeader(", 1)[1].split("}) {", 1)[0]:
        source = source.replace(old_header_props, new_header_props, 1)
        print("[wire_project_home_spectator_follow] extended ProjectHeader props")
    else:
        print("[wire_project_home_spectator_follow] ProjectHeader props already extended")

    # 6) Add member action gate inside ProjectHeader.
    old_state_line = '''  const state = getMomentumState();
  const lifecycle = getLifecycleMeta(project?.status);'''

    new_state_line = '''  const state = getMomentumState();
  const canUseMemberActions = viewerAccess?.canUseMemberActions !== false;
  const showFollowButton = viewerAccess?.showFollowButton === true;
  const lifecycle = getLifecycleMeta(project?.status);'''

    if "const canUseMemberActions = viewerAccess?.canUseMemberActions !== false;" not in source:
        source = source.replace(old_state_line, new_state_line, 1)
        print("[wire_project_home_spectator_follow] added header action gates")
    else:
        print("[wire_project_home_spectator_follow] header action gates already present")

    old_handle_primary = '''  const handlePrimaryAction = () => {
    if (isLifecycleBusy) return;'''

    new_handle_primary = '''  const handlePrimaryAction = () => {
    if (!canUseMemberActions) return;
    if (isLifecycleBusy) return;'''

    if "if (!canUseMemberActions) return;" not in source:
        source = source.replace(old_handle_primary, new_handle_primary, 1)
        print("[wire_project_home_spectator_follow] guarded primary action")
    else:
        print("[wire_project_home_spectator_follow] primary action already guarded")

    # 7) Wrap primary button in canUseMemberActions.
    old_primary_button_start = '''          <button
            onClick={handlePrimaryAction}
            disabled={isLifecycleBusy}'''

    new_primary_button_start = '''          {canUseMemberActions ? (
            <button
              onClick={handlePrimaryAction}
              disabled={isLifecycleBusy}'''

    if "{canUseMemberActions ? (" not in source:
        source = source.replace(old_primary_button_start, new_primary_button_start, 1)

        old_primary_button_end = '''          </button>

          <button
            type="button"
            onClick={onMembersClick}'''

        new_primary_button_end = '''            </button>
          ) : null}

          <button
            type="button"
            onClick={onMembersClick}'''

        source = source.replace(old_primary_button_end, new_primary_button_end, 1)
        print("[wire_project_home_spectator_follow] hid primary action for spectators")
    else:
        print("[wire_project_home_spectator_follow] primary action already conditional")

    # 8) Insert Follow button right after Members button.
    old_members_button = '''          <button
            type="button"
            onClick={onMembersClick}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm
              text-slate-700 dark:text-zinc-300 text-sm font-medium
              hover:bg-slate-50 dark:hover:bg-zinc-800
              transition-all duration-200
            "
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
          </button>'''

    new_members_button = '''          <button
            type="button"
            onClick={onMembersClick}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm
              text-slate-700 dark:text-zinc-300 text-sm font-medium
              hover:bg-slate-50 dark:hover:bg-zinc-800
              transition-all duration-200
            "
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
          </button>

          {showFollowButton ? (
            <button
              type="button"
              onClick={onFollowToggle}
              disabled={followLoading}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm
                text-sm font-medium transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  following
                    ? "bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
                    : "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                }
              `}
              title={`${Number(followersCount || 0)} follower${Number(followersCount || 0) === 1 ? "" : "s"}`}
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : following ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              <span>{following ? "Following" : "Follow"}</span>
            </button>
          ) : null}'''

    if "showFollowButton ? (" not in source:
        source = source.replace(old_members_button, new_members_button, 1)
        print("[wire_project_home_spectator_follow] inserted Follow button beside Members")
    else:
        print("[wire_project_home_spectator_follow] Follow button already present")

    # 9) Hide settings button for spectators.
    old_settings_button = '''          <button
            type="button"
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>'''

    new_settings_button = '''          {canUseMemberActions ? (
            <button
              type="button"
              onClick={onSettings}
              className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : null}'''

    if "{canUseMemberActions ? (\n            <button\n              type=\"button\"\n              onClick={onSettings}" not in source:
        source = source.replace(old_settings_button, new_settings_button, 1)
        print("[wire_project_home_spectator_follow] hid settings for spectators")
    else:
        print("[wire_project_home_spectator_follow] settings already conditional")

    # 10) Add spectator follow state.
    old_state_block = '''  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isReopeningProject, setIsReopeningProject] = useState(false);
  const [isStartingSprint, setIsStartingSprint] = useState(false);'''

    new_state_block = '''  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isReopeningProject, setIsReopeningProject] = useState(false);
  const [isStartingSprint, setIsStartingSprint] = useState(false);
  const [spectatorInitialFollowing, setSpectatorInitialFollowing] = useState(false);'''

    if "spectatorInitialFollowing" not in source:
        source = source.replace(old_state_block, new_state_block, 1)
        print("[wire_project_home_spectator_follow] added spectator follow state")
    else:
        print("[wire_project_home_spectator_follow] spectator follow state already present")

    # 11) Add viewerAccess/useFollow block after useProjectOverview destructuring.
    old_overview_end = '''    overviewMemberCount,
  } = useProjectOverview(id);

  useEffect(() => {'''

    new_overview_end = '''    overviewMemberCount,
  } = useProjectOverview(id);

  const viewerAccess = useMemo(
    () => getProjectViewerAccess(project, user),
    [project, user]
  );

  const {
    following: spectatorFollowing,
    loading: isSpectatorFollowLoading,
    followersCount: spectatorFollowersCount,
    error: spectatorFollowError,
    toggle: toggleSpectatorFollow,
  } = useFollow(
    id,
    spectatorInitialFollowing,
    readNumber(project?.followersCount, 0)
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSpectatorFollowStatus() {
      if (!id || !viewerAccess.showFollowButton) {
        setSpectatorInitialFollowing(false);
        return;
      }

      const following = await getFollowStatus(id);
      if (!cancelled) {
        setSpectatorInitialFollowing(Boolean(following));
      }
    }

    loadSpectatorFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [id, viewerAccess.showFollowButton]);

  useEffect(() => {
    if (!spectatorFollowError) return;

    toast({
      title: "Follow action failed",
      description: spectatorFollowError?.message || "Unable to update follow status.",
      variant: "error",
    });
  }, [spectatorFollowError]);

  const handleSpectatorFollowToggle = useCallback(async () => {
    await toggleSpectatorFollow();
  }, [toggleSpectatorFollow]);

  useEffect(() => {'''

    if "const viewerAccess = useMemo(" not in source:
        source = source.replace(old_overview_end, new_overview_end, 1)
        print("[wire_project_home_spectator_follow] wired viewer access and follow hook")
    else:
        print("[wire_project_home_spectator_follow] viewer access/follow hook already wired")

    # 12) Pass new props into ProjectHeader.
    old_project_header_props = '''        onMembersClick={() => setIsMembersPanelOpen(true)}
        onLifecycleAction={handleFinishLineAction}
        isLifecycleBusy={isCompletingProject || isReopeningProject}
      />'''

    new_project_header_props = '''        onMembersClick={() => setIsMembersPanelOpen(true)}
        onLifecycleAction={handleFinishLineAction}
        isLifecycleBusy={isCompletingProject || isReopeningProject}
        viewerAccess={viewerAccess}
        following={spectatorFollowing}
        followLoading={isSpectatorFollowLoading}
        followersCount={spectatorFollowersCount}
        onFollowToggle={handleSpectatorFollowToggle}
      />'''

    if "viewerAccess={viewerAccess}" not in source:
        source = source.replace(old_project_header_props, new_project_header_props, 1)
        print("[wire_project_home_spectator_follow] passed follow props to ProjectHeader")
    else:
        print("[wire_project_home_spectator_follow] ProjectHeader follow props already passed")

    # 13) Render spectator banner after ProjectHeader.
    old_after_header = '''      <ViewNavigation
        activeView={activeView}'''

    new_after_header = '''      <SpectatorAccessBanner
        viewerAccess={viewerAccess}
        following={spectatorFollowing}
        followersCount={spectatorFollowersCount}
      />

      <ViewNavigation
        activeView={activeView}'''

    if "<SpectatorAccessBanner" not in source.split("return (", 1)[1]:
        source = source.replace(old_after_header, new_after_header, 1)
        print("[wire_project_home_spectator_follow] rendered spectator banner")
    else:
        print("[wire_project_home_spectator_follow] spectator banner already rendered")

    required_after = [
        'import { getFollowStatus } from "../api/follows";',
        'import useFollow from "../hooks/useFollow";',
        "function getProjectViewerAccess(project, user)",
        "function SpectatorAccessBanner",
        "viewerAccess,",
        "showFollowButton",
        "canUseMemberActions",
        "spectatorInitialFollowing",
        "const viewerAccess = useMemo(",
        "useFollow(",
        "getFollowStatus(id)",
        "handleSpectatorFollowToggle",
        "viewerAccess={viewerAccess}",
        "<SpectatorAccessBanner",
        "Follow action failed",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_project_home_spectator_follow] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-spectator-follow-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_project_home_spectator_follow] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_project_home_spectator_follow] patched: {TARGET}")

    print("")
    print("[wire_project_home_spectator_follow] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getProjectViewerAccess|SpectatorAccessBanner|viewerAccess|showFollowButton|canUseMemberActions|spectatorInitialFollowing|useFollow|getFollowStatus|handleSpectatorFollowToggle|Follow action failed\" src/pages/ProjectHome.jsx -C 8")
    print("  git diff -- src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
