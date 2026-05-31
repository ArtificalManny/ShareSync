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
    ROADMAP_PANEL.suffix + f".backup-roadmap-buttons-visible-v2-{timestamp}"
)
modal_backup = ADD_MODAL.with_suffix(
    ADD_MODAL.suffix + f".backup-roadmap-buttons-visible-v2-{timestamp}"
)

panel_backup.write_text(panel_original)
modal_backup.write_text(modal_original)


def find_opening_tag_end(text, start_index):
    """
    JSX-aware scanner.
    Important: this does NOT stop at the > inside arrow functions like:
      onClick={() => handleSomething()}
    """
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


def add_class_to_opening_tag(text, tag_start, class_name, label):
    tag_end = find_opening_tag_end(text, tag_start)
    tag = text[tag_start:tag_end + 1]

    if class_name in tag:
        return text, False

    if 'className="' in tag:
        new_tag = tag.replace('className="', f'className="{class_name} ', 1)
    elif "className='" in tag:
        new_tag = tag.replace("className='", f"className='{class_name} ", 1)
    elif "className={`" in tag:
        new_tag = tag.replace("className={`", "className={`" + class_name + " ", 1)
    elif "className={" in tag:
        raise RuntimeError(
            f"{label} has a dynamic className I do not want to modify automatically. "
            "No changes were written."
        )
    else:
        new_tag = tag[:-1] + f' className="{class_name}">'

    return text[:tag_start] + new_tag + text[tag_end + 1:], True


def insert_style_after_opening_tag(text, tag_start, style_block, marker, label):
    if marker in text:
        return text, False

    tag_end = find_opening_tag_end(text, tag_start)
    return text[:tag_end + 1] + "\n" + style_block + text[tag_end + 1:], True


def add_class_to_button_before_text(text, button_text, class_name, label, use_last=False):
    marker_index = text.rfind(button_text) if use_last else text.find(button_text)

    if marker_index == -1:
        raise RuntimeError(f"Could not find text marker for {label}: {button_text}")

    button_start = text.rfind("<button", 0, marker_index)

    if button_start == -1:
        raise RuntimeError(f"Could not find opening <button> for {label}")

    return add_class_to_opening_tag(text, button_start, class_name, label)


panel_style = r'''        <style className="roadmap-button-visibility-v2-style">
          {`
            .roadmap-force-visible-button-v2 {
              position: relative !important;
              isolation: isolate !important;
              overflow: hidden !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              color: #ffffff !important;
              opacity: 1 !important;
              border: 1px solid rgba(221, 214, 254, 0.92) !important;
              box-shadow:
                0 16px 36px rgba(109, 40, 217, 0.40),
                inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
              text-shadow: 0 1px 8px rgba(0, 0, 0, 0.24) !important;
            }

            .roadmap-force-visible-button-v2:hover:not(:disabled) {
              transform: translateY(-1px) !important;
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 20px 44px rgba(109, 40, 217, 0.48),
                inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
            }

            .roadmap-force-visible-button-v2:disabled {
              background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
              color: #ffffff !important;
              opacity: 0.88 !important;
              cursor: not-allowed !important;
              box-shadow:
                0 12px 28px rgba(109, 40, 217, 0.28),
                inset 0 1px 0 rgba(255, 255, 255, 0.26) !important;
            }

            .roadmap-force-visible-button-v2,
            .roadmap-force-visible-button-v2 span,
            .roadmap-force-visible-button-v2 svg {
              color: #ffffff !important;
              stroke: #ffffff !important;
              opacity: 1 !important;
            }
          `}
        </style>'''

modal_style = r'''      <style className="roadmap-create-button-visibility-v2-style">
        {`
          .roadmap-create-force-visible-button-v2 {
            position: relative !important;
            isolation: isolate !important;
            overflow: hidden !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            opacity: 1 !important;
            border: 1px solid rgba(221, 214, 254, 0.92) !important;
            box-shadow:
              0 16px 36px rgba(109, 40, 217, 0.40),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.24) !important;
          }

          .roadmap-create-force-visible-button-v2:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
          }

          .roadmap-create-force-visible-button-v2:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
            color: #ffffff !important;
            opacity: 0.88 !important;
            cursor: not-allowed !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.26) !important;
          }

          .roadmap-create-force-visible-button-v2,
          .roadmap-create-force-visible-button-v2 span,
          .roadmap-create-force-visible-button-v2 svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
            opacity: 1 !important;
          }
        `}
      </style>'''


# ─────────────────────────────────────────────────────────────────────────────
# RoadmapPanel.jsx: Add Milestone button
# ─────────────────────────────────────────────────────────────────────────────

panel_updated = panel_original

roadmap_anchor = "Track milestones, deadlines, and delivery progress as tasks move across the project."
roadmap_anchor_index = panel_updated.find(roadmap_anchor)

if roadmap_anchor_index == -1:
    raise RuntimeError("Could not find Roadmap header anchor text in RoadmapPanel.jsx.")

section_start = panel_updated.rfind("<section", 0, roadmap_anchor_index)

if section_start == -1:
    raise RuntimeError("Could not find RoadmapPanel root <section> before Roadmap header.")

panel_updated, panel_style_added = insert_style_after_opening_tag(
    panel_updated,
    section_start,
    panel_style,
    "roadmap-button-visibility-v2-style",
    "RoadmapPanel style",
)

panel_updated, add_class_added = add_class_to_button_before_text(
    panel_updated,
    "Add Milestone",
    "roadmap-force-visible-button-v2",
    "Add Milestone button",
    use_last=False,
)


# ─────────────────────────────────────────────────────────────────────────────
# AddMilestoneModal.jsx: Create Milestone button
# ─────────────────────────────────────────────────────────────────────────────

modal_updated = modal_original

return_index = modal_updated.find("return (")

if return_index == -1:
    raise RuntimeError("Could not find return block in AddMilestoneModal.jsx.")

modal_root_start = modal_updated.find("<div", return_index)

if modal_root_start == -1:
    raise RuntimeError("Could not find AddMilestoneModal root <div>.")

modal_updated, root_class_added = add_class_to_opening_tag(
    modal_updated,
    modal_root_start,
    "roadmap-create-milestone-modal-v2",
    "AddMilestoneModal root",
)

modal_updated, modal_style_added = insert_style_after_opening_tag(
    modal_updated,
    modal_root_start,
    modal_style,
    "roadmap-create-button-visibility-v2-style",
    "AddMilestoneModal style",
)

modal_updated, create_class_added = add_class_to_button_before_text(
    modal_updated,
    "Create Milestone",
    "roadmap-create-force-visible-button-v2",
    "Create Milestone submit button",
    use_last=True,
)


# Only check for the REAL bad corruption shape from the earlier failed patch.
real_bad_patterns = [
    'onClick={() = className=',
    'onClick={()= className=',
    'className="roadmap-add-milestone-button"> onAddMilestone',
    'className="roadmap-force-visible-button"> onAddMilestone',
]

for bad in real_bad_patterns:
    if bad in panel_updated or bad in modal_updated:
        raise RuntimeError(
            f"Actual unsafe JSX corruption pattern still present: {bad}. No changes were written."
        )

ROADMAP_PANEL.write_text(panel_updated)
ADD_MODAL.write_text(modal_updated)

print("Roadmap button visibility v2 patch applied successfully.")
print(f"Updated file: {ROADMAP_PANEL}")
print(f"Backup file:  {panel_backup}")
print(f"Updated file: {ADD_MODAL}")
print(f"Backup file:  {modal_backup}")
print("")
print("Changed only:")
print("- Add Milestone button visibility")
print("- Create Milestone button visibility")
print("- Added scoped CSS visibility overrides")
print("")
print("Details:")
print(f"- RoadmapPanel style added: {panel_style_added}")
print(f"- Add Milestone class added: {add_class_added}")
print(f"- Modal root class added: {root_class_added}")
print(f"- Modal style added: {modal_style_added}")
print(f"- Create Milestone class added: {create_class_added}")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No milestone creation, editing, deletion, filtering, sorting, or refresh logic was changed.")
