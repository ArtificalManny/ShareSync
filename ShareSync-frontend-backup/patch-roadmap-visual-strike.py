from pathlib import Path
from datetime import datetime

ROADMAP_PANEL = Path("src/components/roadmap/RoadmapPanel.jsx")
MILESTONE_CARD = Path("src/components/roadmap/MilestoneCard.jsx")
ADD_MODAL = Path("src/components/roadmap/AddMilestoneModal.jsx")

TARGETS = [ROADMAP_PANEL, MILESTONE_CARD, ADD_MODAL]

for path in TARGETS:
    if not path.exists():
        raise FileNotFoundError(f"Could not find {path}")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

originals = {path: path.read_text() for path in TARGETS}
backups = {}

for path, content in originals.items():
    backup_path = path.with_suffix(path.suffix + f".backup-roadmap-visual-strike-{timestamp}")
    backup_path.write_text(content)
    backups[path] = backup_path


def find_opening_tag_end(text, start):
    quote = None
    i = start

    while i < len(text):
        ch = text[i]

        if quote:
            if ch == quote and text[i - 1] != "\\":
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == ">":
                return i

        i += 1

    raise RuntimeError("Could not find end of opening tag.")


def add_class_to_opening_tag(text, tag_start, class_name, label):
    tag_end = find_opening_tag_end(text, tag_start)
    tag = text[tag_start:tag_end + 1]

    if class_name in tag:
        return text

    if 'className={`' in tag:
        new_tag = tag.replace('className={`', 'className={`' + class_name + ' ', 1)
    elif 'className="' in tag:
        new_tag = tag.replace('className="', 'className="' + class_name + ' ', 1)
    elif "className='" in tag:
        new_tag = tag.replace("className='", "className='" + class_name + " ", 1)
    elif "className={" in tag:
        raise RuntimeError(
            f"{label} uses a dynamic className I do not want to touch automatically. "
            "No changes were written."
        )
    else:
        new_tag = tag[:-1] + f' className="{class_name}">'

    return text[:tag_start] + new_tag + text[tag_end + 1:]


def insert_after_opening_tag(text, tag_start, insertion, unique_marker, label):
    if unique_marker in text:
        return text

    tag_end = find_opening_tag_end(text, tag_start)
    return text[:tag_end + 1] + "\n" + insertion + text[tag_end + 1:]


def add_class_to_buttons_before_marker(text, marker, class_name, label):
    positions = []
    start = 0

    while True:
        idx = text.find(marker, start)
        if idx == -1:
            break
        positions.append(idx)
        start = idx + len(marker)

    if not positions:
        raise RuntimeError(f"Could not find marker for {label}: {marker}")

    updated = text
    changed = 0
    seen_button_starts = set()

    for idx in reversed(positions):
        button_start = updated.rfind("<button", 0, idx)
        if button_start == -1:
            continue

        if button_start in seen_button_starts:
            continue

        seen_button_starts.add(button_start)
        updated = add_class_to_opening_tag(updated, button_start, class_name, label)
        changed += 1

    if changed == 0:
        raise RuntimeError(f"Found marker but could not find a preceding button for {label}.")

    return updated, changed


# ─────────────────────────────────────────────────────────────────────────────
# 1) RoadmapPanel.jsx
# ─────────────────────────────────────────────────────────────────────────────

panel = originals[ROADMAP_PANEL]

if "roadmap-command-map-visual-style" in panel:
    raise RuntimeError("RoadmapPanel.jsx already appears patched. No changes were written.")

panel_anchor = "Track milestones, deadlines, and delivery progress as tasks move across the project."
panel_anchor_idx = panel.find(panel_anchor)

if panel_anchor_idx == -1:
    raise RuntimeError(
        "Could not find the RoadmapPanel header anchor text. "
        "No changes were written."
    )

panel_section_start = panel.rfind("<section", 0, panel_anchor_idx)

if panel_section_start == -1:
    raise RuntimeError(
        "Could not find the RoadmapPanel <section> before the Roadmap header. "
        "No changes were written."
    )

roadmap_panel_style = r'''        <style className="roadmap-command-map-visual-style">
          {`
            .roadmap-command-map {
              isolation: isolate;
            }

            .roadmap-command-map > div:first-of-type {
              background:
                radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
                radial-gradient(circle at 88% 4%, rgba(34, 211, 238, 0.15), transparent 32%),
                radial-gradient(circle at 72% 100%, rgba(52, 211, 153, 0.12), transparent 28%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.82)) !important;
              border-color: rgba(124, 58, 237, 0.22) !important;
              box-shadow:
                0 30px 96px rgba(15, 23, 42, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
            }

            .dark .roadmap-command-map > div:first-of-type {
              background:
                radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
                radial-gradient(circle at 88% 4%, rgba(34, 211, 238, 0.13), transparent 32%),
                radial-gradient(circle at 72% 100%, rgba(52, 211, 153, 0.10), transparent 28%),
                linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.92)) !important;
              border-color: rgba(255, 255, 255, 0.12) !important;
              box-shadow:
                0 32px 110px rgba(0, 0, 0, 0.52),
                inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
            }

            .roadmap-command-map > div:first-of-type > div:first-child {
              height: 5px !important;
              background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 44%, #34d399 100%) !important;
              box-shadow:
                0 0 24px rgba(139, 92, 246, 0.42),
                0 0 28px rgba(34, 211, 238, 0.30);
            }

            .roadmap-command-map header:first-of-type {
              border-radius: 28px;
              padding: 16px;
              background: rgba(255, 255, 255, 0.46);
              border: 1px solid rgba(255, 255, 255, 0.64);
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.76),
                0 18px 40px rgba(15, 23, 42, 0.06);
              backdrop-filter: blur(18px);
            }

            .dark .roadmap-command-map header:first-of-type {
              background: rgba(15, 23, 42, 0.42);
              border-color: rgba(255, 255, 255, 0.08);
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.06),
                0 20px 46px rgba(0, 0, 0, 0.30);
            }

            .roadmap-command-map header:first-of-type .h-14.w-14 {
              background:
                radial-gradient(circle at 30% 18%, rgba(255,255,255,0.92), transparent 34%),
                linear-gradient(135deg, rgba(139, 92, 246, 0.20), rgba(34, 211, 238, 0.14)) !important;
              box-shadow:
                0 18px 36px rgba(124, 58, 237, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
            }

            .dark .roadmap-command-map header:first-of-type .h-14.w-14 {
              background:
                radial-gradient(circle at 30% 18%, rgba(255,255,255,0.18), transparent 34%),
                linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(34, 211, 238, 0.14)) !important;
              box-shadow:
                0 18px 40px rgba(124, 58, 237, 0.22),
                inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
            }

            .roadmap-refresh-button {
              background: rgba(255, 255, 255, 0.86) !important;
              color: #334155 !important;
              border-color: rgba(148, 163, 184, 0.28) !important;
              box-shadow:
                0 12px 26px rgba(15, 23, 42, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
              backdrop-filter: blur(18px);
            }

            .roadmap-refresh-button:hover {
              color: #6d28d9 !important;
              border-color: rgba(139, 92, 246, 0.34) !important;
              box-shadow:
                0 18px 38px rgba(124, 58, 237, 0.16),
                inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
            }

            .dark .roadmap-refresh-button {
              background: rgba(255, 255, 255, 0.08) !important;
              color: rgba(226, 232, 240, 0.92) !important;
              border-color: rgba(255, 255, 255, 0.10) !important;
            }

            .roadmap-add-milestone-button {
              position: relative;
              isolation: isolate;
              overflow: hidden;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              color: #ffffff !important;
              border-color: rgba(221, 214, 254, 0.84) !important;
              box-shadow:
                0 16px 36px rgba(109, 40, 217, 0.36),
                inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
              opacity: 1 !important;
            }

            .roadmap-add-milestone-button:hover {
              transform: translateY(-1px);
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 20px 44px rgba(109, 40, 217, 0.44),
                inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
            }

            .roadmap-add-milestone-button,
            .roadmap-add-milestone-button span,
            .roadmap-add-milestone-button svg {
              color: #ffffff !important;
              opacity: 1 !important;
              text-shadow: 0 1px 8px rgba(0, 0, 0, 0.22);
            }

            .roadmap-command-map header + div > div {
              position: relative;
              overflow: hidden;
              min-height: 100px;
              backdrop-filter: blur(18px);
              box-shadow:
                0 14px 34px rgba(15, 23, 42, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
              transition:
                transform 180ms ease,
                box-shadow 180ms ease,
                border-color 180ms ease;
            }

            .roadmap-command-map header + div > div::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 62%);
              opacity: 0.88;
            }

            .roadmap-command-map header + div > div > * {
              position: relative;
              z-index: 1;
            }

            .roadmap-command-map header + div > div:hover {
              transform: translateY(-2px);
              box-shadow:
                0 20px 46px rgba(15, 23, 42, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.76) !important;
            }

            .dark .roadmap-command-map header + div > div {
              box-shadow:
                0 16px 38px rgba(0, 0, 0, 0.30),
                inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
            }

            .roadmap-command-map header + div > div:nth-child(1) {
              border-top: 3px solid rgba(100, 116, 139, 0.76) !important;
            }

            .roadmap-command-map header + div > div:nth-child(2) {
              border-top: 3px solid rgba(56, 189, 248, 0.88) !important;
            }

            .roadmap-command-map header + div > div:nth-child(3) {
              border-top: 3px solid rgba(139, 92, 246, 0.88) !important;
            }

            .roadmap-command-map header + div > div:nth-child(4) {
              border-top: 3px solid rgba(16, 185, 129, 0.88) !important;
            }

            .roadmap-command-map header + div > div:nth-child(5) {
              border-top: 3px solid rgba(244, 63, 94, 0.88) !important;
            }

            .roadmap-command-map button {
              transition:
                transform 180ms ease,
                box-shadow 180ms ease,
                border-color 180ms ease,
                background 180ms ease;
            }

            .roadmap-command-map button:hover {
              transform: translateY(-1px);
            }

            .roadmap-command-map select {
              box-shadow:
                0 10px 24px rgba(15, 23, 42, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
            }

            .roadmap-milestone-card {
              position: relative;
              overflow: hidden;
              background:
                radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.08), transparent 38%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92)) !important;
              border-color: rgba(148, 163, 184, 0.22) !important;
              box-shadow:
                0 16px 38px rgba(15, 23, 42, 0.10),
                inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
              transition:
                transform 180ms ease,
                box-shadow 180ms ease,
                border-color 180ms ease;
            }

            .roadmap-milestone-card::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 14% 0%, rgba(255, 255, 255, 0.95), transparent 34%),
                linear-gradient(90deg, rgba(139, 92, 246, 0.08), transparent 34%);
              opacity: 0.85;
            }

            .roadmap-milestone-card > * {
              position: relative;
              z-index: 1;
            }

            .roadmap-milestone-card:hover {
              transform: translateY(-3px);
              border-color: rgba(139, 92, 246, 0.34) !important;
              box-shadow:
                0 24px 54px rgba(15, 23, 42, 0.16),
                inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
            }

            .dark .roadmap-milestone-card {
              background:
                radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.13), transparent 38%),
                linear-gradient(135deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.62)) !important;
              border-color: rgba(255, 255, 255, 0.08) !important;
              box-shadow:
                0 18px 44px rgba(0, 0, 0, 0.36),
                inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
            }

            .dark .roadmap-milestone-card:hover {
              border-color: rgba(139, 92, 246, 0.38) !important;
              box-shadow:
                0 24px 58px rgba(0, 0, 0, 0.46),
                inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
            }
          `}
        </style>'''

panel = add_class_to_opening_tag(
    panel,
    panel_section_start,
    "roadmap-command-map",
    "RoadmapPanel main section",
)

panel = insert_after_opening_tag(
    panel,
    panel_section_start,
    roadmap_panel_style,
    "roadmap-command-map-visual-style",
    "RoadmapPanel scoped style",
)

panel, add_button_count = add_class_to_buttons_before_marker(
    panel,
    "Add Milestone",
    "roadmap-add-milestone-button",
    "RoadmapPanel Add Milestone button",
)

panel, refresh_button_count = add_class_to_buttons_before_marker(
    panel,
    "Refresh",
    "roadmap-refresh-button",
    "RoadmapPanel Refresh button",
)


# ─────────────────────────────────────────────────────────────────────────────
# 2) MilestoneCard.jsx
# ─────────────────────────────────────────────────────────────────────────────

card = originals[MILESTONE_CARD]

if "roadmap-milestone-card" in card:
    raise RuntimeError("MilestoneCard.jsx already appears patched. No changes were written.")

card_anchor = "const MilestoneCard"
card_anchor_idx = card.find(card_anchor)

if card_anchor_idx == -1:
    raise RuntimeError("Could not find const MilestoneCard in MilestoneCard.jsx. No changes were written.")

card_return_idx = card.find("return (", card_anchor_idx)

if card_return_idx == -1:
    raise RuntimeError("Could not find MilestoneCard return block. No changes were written.")

card_root_div = card.find("<div", card_return_idx)

if card_root_div == -1:
    raise RuntimeError("Could not find MilestoneCard root div. No changes were written.")

card = add_class_to_opening_tag(
    card,
    card_root_div,
    "roadmap-milestone-card",
    "MilestoneCard root card",
)


# ─────────────────────────────────────────────────────────────────────────────
# 3) AddMilestoneModal.jsx
# ─────────────────────────────────────────────────────────────────────────────

modal = originals[ADD_MODAL]

if "roadmap-create-modal-visual-style" in modal:
    raise RuntimeError("AddMilestoneModal.jsx already appears patched. No changes were written.")

modal_anchor = "export default function AddMilestoneModal"
modal_anchor_idx = modal.find(modal_anchor)

if modal_anchor_idx == -1:
    raise RuntimeError("Could not find AddMilestoneModal component. No changes were written.")

modal_return_idx = modal.find("return (", modal_anchor_idx)

if modal_return_idx == -1:
    raise RuntimeError("Could not find AddMilestoneModal return block. No changes were written.")

modal_root_div = modal.find("<div", modal_return_idx)

if modal_root_div == -1:
    raise RuntimeError("Could not find AddMilestoneModal root div. No changes were written.")

modal_style = r'''      <style className="roadmap-create-modal-visual-style">
        {`
          .roadmap-create-milestone-modal > div {
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 34px 110px rgba(15, 23, 42, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .roadmap-create-milestone-modal > div {
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 34px 120px rgba(0, 0, 0, 0.58),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .roadmap-create-milestone-modal footer,
          .roadmap-create-milestone-modal [class*="sticky"][class*="bottom"] {
            background:
              linear-gradient(180deg, rgba(248, 250, 252, 0.82), rgba(226, 232, 240, 0.74)) !important;
            border-color: rgba(148, 163, 184, 0.20) !important;
            backdrop-filter: blur(20px);
          }

          .dark .roadmap-create-milestone-modal footer,
          .dark .roadmap-create-milestone-modal [class*="sticky"][class*="bottom"] {
            background:
              linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.82)) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }

          .roadmap-create-button {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            border-color: rgba(221, 214, 254, 0.88) !important;
            box-shadow:
              0 16px 36px rgba(109, 40, 217, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
            opacity: 1 !important;
          }

          .roadmap-create-button:hover:not(:disabled) {
            transform: translateY(-1px);
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.44),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
          }

          .roadmap-create-button:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
            color: #ffffff !important;
            opacity: 0.82 !important;
            cursor: not-allowed !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
          }

          .roadmap-create-button,
          .roadmap-create-button span,
          .roadmap-create-button svg {
            color: #ffffff !important;
            opacity: 1 !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.22);
          }
        `}
      </style>'''

modal = add_class_to_opening_tag(
    modal,
    modal_root_div,
    "roadmap-create-milestone-modal",
    "AddMilestoneModal root",
)

modal = insert_after_opening_tag(
    modal,
    modal_root_div,
    modal_style,
    "roadmap-create-modal-visual-style",
    "AddMilestoneModal scoped style",
)

create_button_marker_idx = modal.rfind("Create Milestone")

if create_button_marker_idx == -1:
    raise RuntimeError("Could not find Create Milestone text in AddMilestoneModal.jsx. No changes were written.")

create_button_start = modal.rfind("<button", 0, create_button_marker_idx)

if create_button_start == -1:
    raise RuntimeError("Could not find Create Milestone button. No changes were written.")

modal = add_class_to_opening_tag(
    modal,
    create_button_start,
    "roadmap-create-button",
    "AddMilestoneModal Create Milestone button",
)


ROADMAP_PANEL.write_text(panel)
MILESTONE_CARD.write_text(card)
ADD_MODAL.write_text(modal)

print("Roadmap visual strike patch applied successfully.")
print(f"Updated file: {ROADMAP_PANEL}")
print(f"Backup file:  {backups[ROADMAP_PANEL]}")
print(f"Updated file: {MILESTONE_CARD}")
print(f"Backup file:  {backups[MILESTONE_CARD]}")
print(f"Updated file: {ADD_MODAL}")
print(f"Backup file:  {backups[ADD_MODAL]}")
print("")
print("Changed only:")
print("- Roadmap visual shell, top rail, header, stats, refresh button, and Add Milestone button")
print("- Milestone card visual depth and hover polish")
print("- Create Milestone modal visibility and Create Milestone button contrast")
print("")
print("Buttons tagged:")
print(f"- Add Milestone buttons: {add_button_count}")
print(f"- Refresh buttons: {refresh_button_count}")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No milestone creation, editing, deletion, filtering, sorting, task-linking, or refresh logic was changed.")
