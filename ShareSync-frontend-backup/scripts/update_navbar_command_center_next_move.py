#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/Navbar.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[update_navbar_command_center_next_move] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[update_navbar_command_center_next_move] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        'import FocusModeToggle from "./navbar/FocusModeToggle";',
        'import SeasonBadge from "./navbar/SeasonBadge";',
        '<SeasonBadge />',
        '<div className="hidden sm:block"><FocusModeToggle /></div>',
        'const handleSearch = (e) => {',
        'const IconButton = ({',
        'export default function Navbar({',
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Remove old imports for the controls we are replacing.
    source = source.replace('import FocusModeToggle from "./navbar/FocusModeToggle";\n', "")
    source = source.replace('import SeasonBadge from "./navbar/SeasonBadge";\n', "")

    # 2) Add local button components after IconButton.
    old_icon_button = """const IconButton = ({
  children,
  onClick,
  className = "",
  badge = null,
  title = "",
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative p-2 text-slate-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}
  >
    {children}
    {badge}
  </button>
);

export default function Navbar({"""

    new_icon_button = """const IconButton = ({
  children,
  onClick,
  className = "",
  badge = null,
  title = "",
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative p-2 text-slate-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}
  >
    {children}
    {badge}
  </button>
);

const CommandCenterButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5
      text-sm font-semibold text-slate-600 dark:text-zinc-300
      transition-all duration-200
      hover:bg-white/70 hover:text-violet-600
      dark:hover:bg-white/5 dark:hover:text-violet-300
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
    "
    title="Open Command Center"
  >
    <Layout className="h-4 w-4 text-violet-500 dark:text-violet-400" />
    <span>Command Center</span>
    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600" />
  </button>
);

const NextMoveButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10
      bg-white/70 dark:bg-white/[0.03]
      px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-zinc-300
      shadow-sm dark:shadow-none
      transition-all duration-200
      hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600 hover:shadow-md hover:shadow-violet-500/10
      dark:hover:border-violet-500/30 dark:hover:bg-white/[0.06] dark:hover:text-violet-300
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
    "
    title="Open your next recommended move"
  >
    <Zap className="h-4 w-4 text-violet-500 dark:text-violet-400" />
    <span>Next Move</span>
  </button>
);

export default function Navbar({"""

    if "const CommandCenterButton = ({ onClick }) => (" not in source:
        if old_icon_button not in source:
            fail("Could not find IconButton block insertion point.")
        source = source.replace(old_icon_button, new_icon_button, 1)
        print("[update_navbar_command_center_next_move] inserted CommandCenterButton and NextMoveButton")
    else:
        print("[update_navbar_command_center_next_move] local navbar action buttons already present")

    # 3) Add click handlers after handleSearch.
    old_handle_search = """  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };


  const navbarGlowStyle = useMemo(() => {"""

    new_handle_search = """  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleOpenCommandCenter = () => {
    try {
      window.dispatchEvent(new CustomEvent("openshare:command-center"));
    } catch {}

    navigate("/home?panel=command-center");
  };

  const handleOpenNextMove = () => {
    try {
      window.dispatchEvent(new CustomEvent("openshare:next-move"));
    } catch {}

    navigate("/home?next=move");
  };


  const navbarGlowStyle = useMemo(() => {"""

    if "const handleOpenCommandCenter = () => {" not in source:
        if old_handle_search not in source:
            fail("Could not find handleSearch insertion point.")
        source = source.replace(old_handle_search, new_handle_search, 1)
        print("[update_navbar_command_center_next_move] inserted action handlers")
    else:
        print("[update_navbar_command_center_next_move] action handlers already present")

    # 4) Replace SeasonBadge slot with Command Center.
    if "<SeasonBadge />" in source:
        source = source.replace("<SeasonBadge />", "<CommandCenterButton onClick={handleOpenCommandCenter} />", 1)
        print("[update_navbar_command_center_next_move] replaced SeasonBadge with Command Center")
    else:
        print("[update_navbar_command_center_next_move] SeasonBadge already replaced")

    # 5) Replace FocusModeToggle slot with Next Move.
    old_focus_slot = '<div className="hidden sm:block"><FocusModeToggle /></div>'
    new_focus_slot = '<div className="hidden sm:block"><NextMoveButton onClick={handleOpenNextMove} /></div>'

    if old_focus_slot in source:
        source = source.replace(old_focus_slot, new_focus_slot, 1)
        print("[update_navbar_command_center_next_move] replaced FocusModeToggle with Next Move")
    else:
        print("[update_navbar_command_center_next_move] FocusModeToggle slot already replaced")

    required_after = [
        "const CommandCenterButton = ({ onClick }) => (",
        "const NextMoveButton = ({ onClick }) => (",
        "const handleOpenCommandCenter = () => {",
        "const handleOpenNextMove = () => {",
        'window.dispatchEvent(new CustomEvent("openshare:command-center"));',
        'window.dispatchEvent(new CustomEvent("openshare:next-move"));',
        'navigate("/home?panel=command-center");',
        'navigate("/home?next=move");',
        "<CommandCenterButton onClick={handleOpenCommandCenter} />",
        "<NextMoveButton onClick={handleOpenNextMove} />",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    forbidden_after = [
        'import FocusModeToggle from "./navbar/FocusModeToggle";',
        'import SeasonBadge from "./navbar/SeasonBadge";',
        "<SeasonBadge />",
        "<FocusModeToggle />",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Safety check failed after patch. Old marker still present: {marker}")

    if source == original:
        print("[update_navbar_command_center_next_move] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-command-center-next-move-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[update_navbar_command_center_next_move] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[update_navbar_command_center_next_move] patched: {TARGET}")

    print("")
    print("[update_navbar_command_center_next_move] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"CommandCenterButton|NextMoveButton|handleOpenCommandCenter|handleOpenNextMove|SeasonBadge|FocusModeToggle|Command Center|Next Move|openshare:command-center|openshare:next-move\" src/components/Navbar.jsx -C 8")
    print("  git diff -- src/components/Navbar.jsx")


if __name__ == "__main__":
    main()
