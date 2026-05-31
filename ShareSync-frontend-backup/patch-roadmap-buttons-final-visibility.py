from pathlib import Path
from datetime import datetime

ROADMAP_PANEL = Path("src/components/roadmap/RoadmapPanel.jsx")
ADD_MODAL = Path("src/components/roadmap/AddMilestoneModal.jsx")

for path in [ROADMAP_PANEL, ADD_MODAL]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find {path}")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

panel_original = ROADMAP_PANEL.read_text()
modal_original = ADD_MODAL.read_text()

panel_backup = ROADMAP_PANEL.with_suffix(
    ROADMAP_PANEL.suffix + f".backup-roadmap-final-button-visibility-{timestamp}"
)
modal_backup = ADD_MODAL.with_suffix(
    ADD_MODAL.suffix + f".backup-roadmap-final-button-visibility-{timestamp}"
)

panel_backup.write_text(panel_original)
modal_backup.write_text(modal_original)


def find_opening_tag_end(text, start_index):
    quote = None
    brace_depth = 0
    i = start_index

    while i < len(text):
        ch = text[i]
        prev = text[i - 1] if i > 0 else ""

        if quote:
            if ch == quote and prev != "\\":
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                brace_depth += 1
            elif ch == "}":
                brace_depth = max(0, brace_depth - 1)
            elif ch == ">" and brace_depth == 0:
                return i

        i += 1

    raise RuntimeError("Could not find the end of the JSX opening tag.")


def insert_style_after_opening_tag(text, tag_start, style_block, marker):
    if marker in text:
        return text, False

    tag_end = find_opening_tag_end(text, tag_start)
    return text[:tag_end + 1] + "\n" + style_block + text[tag_end + 1:], True


panel_style = r'''        <style className="roadmap-final-button-visibility-style">
          {`
            section.roadmap-command-map button.roadmap-hard-purple-button,
            section.roadmap-command-map button.roadmap-hard-purple-button:disabled,
            section.roadmap-command-map button.roadmap-hard-purple-button[disabled],
            section.roadmap-command-map button.roadmap-force-visible-button-v2,
            section.roadmap-command-map button.roadmap-force-visible-button-v2:disabled,
            section.roadmap-command-map button.roadmap-force-visible-button-v2[disabled],
            section.roadmap-command-map button.roadmap-add-milestone-button,
            section.roadmap-command-map button.roadmap-add-milestone-button:disabled,
            section.roadmap-command-map button.roadmap-add-milestone-button[disabled] {
              background-color: #7c3aed !important;
              background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 46%, #5b21b6 100%) !important;
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
              border: 1px solid rgba(221, 214, 254, 0.96) !important;
              box-shadow:
                0 18px 42px rgba(109, 40, 217, 0.46),
                inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
              text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28) !important;
            }

            section.roadmap-command-map button.roadmap-hard-purple-button *,
            section.roadmap-command-map button.roadmap-force-visible-button-v2 *,
            section.roadmap-command-map button.roadmap-add-milestone-button * {
              color: #ffffff !important;
              stroke: #ffffff !important;
              fill: none !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
            }

            section.roadmap-command-map button.roadmap-hard-purple-button:hover:not(:disabled),
            section.roadmap-command-map button.roadmap-force-visible-button-v2:hover:not(:disabled),
            section.roadmap-command-map button.roadmap-add-milestone-button:hover:not(:disabled) {
              transform: translateY(-1px) !important;
              background-image: linear-gradient(135deg, #9333ea 0%, #6d28d9 48%, #4c1d95 100%) !important;
              box-shadow:
                0 22px 50px rgba(109, 40, 217, 0.54),
                inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
            }
          `}
        </style>'''

modal_style = r'''      <style className="roadmap-create-final-button-visibility-style">
        {`
          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button:disabled,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button[disabled],
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button,
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button:disabled,
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button[disabled],
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2:disabled,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2[disabled],
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button:disabled,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button[disabled] {
            background-color: #7c3aed !important;
            background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 46%, #5b21b6 100%) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
            border: 1px solid rgba(221, 214, 254, 0.96) !important;
            box-shadow:
              0 18px 42px rgba(109, 40, 217, 0.46),
              inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28) !important;
          }

          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button *,
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button *,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2 *,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button * {
            color: #ffffff !important;
            stroke: #ffffff !important;
            fill: none !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
          }

          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button:hover:not(:disabled),
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button:hover:not(:disabled),
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2:hover:not(:disabled),
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background-image: linear-gradient(135deg, #9333ea 0%, #6d28d9 48%, #4c1d95 100%) !important;
            box-shadow:
              0 22px 50px rgba(109, 40, 217, 0.54),
              inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
          }
        `}
      </style>'''


panel_updated = panel_original
modal_updated = modal_original

roadmap_anchor = "Track milestones, deadlines, and delivery progress as tasks move across the project."
roadmap_anchor_index = panel_updated.find(roadmap_anchor)

if roadmap_anchor_index == -1:
    raise RuntimeError("Could not find Roadmap header anchor text in RoadmapPanel.jsx.")

section_start = panel_updated.rfind("<section", 0, roadmap_anchor_index)

if section_start == -1:
    raise RuntimeError("Could not find RoadmapPanel root <section>.")

panel_updated, panel_style_added = insert_style_after_opening_tag(
    panel_updated,
    section_start,
    panel_style,
    "roadmap-final-button-visibility-style",
)

return_index = modal_updated.find("return (")

if return_index == -1:
    raise RuntimeError("Could not find return block in AddMilestoneModal.jsx.")

modal_root_start = modal_updated.find("<div", return_index)

if modal_root_start == -1:
    raise RuntimeError("Could not find AddMilestoneModal root <div>.")

modal_updated, modal_style_added = insert_style_after_opening_tag(
    modal_updated,
    modal_root_start,
    modal_style,
    "roadmap-create-final-button-visibility-style",
)

real_bad_patterns = [
    'onClick={() = className=',
    'onClick={()= className=',
    'className="roadmap-add-milestone-button"> onAddMilestone',
    'className="roadmap-force-visible-button"> onAddMilestone',
]

for bad in real_bad_patterns:
    if bad in panel_updated or bad in modal_updated:
        raise RuntimeError(
            f"Unsafe JSX corruption pattern still present: {bad}. No changes were written."
        )

ROADMAP_PANEL.write_text(panel_updated)
ADD_MODAL.write_text(modal_updated)

print("Roadmap final button visibility override applied successfully.")
print(f"Updated file: {ROADMAP_PANEL}")
print(f"Backup file:  {panel_backup}")
print(f"Updated file: {ADD_MODAL}")
print(f"Backup file:  {modal_backup}")
print("")
print("Changed only:")
print("- Added final high-specificity CSS override for Add Milestone")
print("- Added final high-specificity CSS override for Create Milestone")
print("")
print(f"RoadmapPanel style added: {panel_style_added}")
print(f"AddMilestoneModal style added: {modal_style_added}")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No milestone creation, editing, deletion, filtering, sorting, or refresh logic was changed.")
