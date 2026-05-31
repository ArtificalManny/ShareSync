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
    ROADMAP_PANEL.suffix + f".backup-roadmap-button-visibility-fix-{timestamp}"
)
modal_backup = ADD_MODAL.with_suffix(
    ADD_MODAL.suffix + f".backup-roadmap-button-visibility-fix-{timestamp}"
)

panel_backup.write_text(panel_original)
modal_backup.write_text(modal_original)


def find_opening_tag_end(text, start_index):
    """
    JSX-aware opening tag scanner.
    This avoids the previous bug where the scanner stopped at the arrow in:
      onClick={() => ...}
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


def add_class_to_button_before_text(text, button_text, class_name, label):
    marker_index = text.find(button_text)

    if marker_index == -1:
        raise RuntimeError(f"Could not find button text for {label}: {button_text}")

    button_start = text.rfind("<button", 0, marker_index)

    if button_start == -1:
        raise RuntimeError(f"Could not find opening <button> for {label}")

    button_end = find_opening_tag_end(text, button_start)
    tag = text[button_start:button_end + 1]

    if class_name in tag:
        return text, False

    if 'className="' in tag:
        new_tag = tag.replace('className="', f'className="{class_name} ', 1)
    elif "className='" in tag:
        new_tag = tag.replace("className='", f"className='{class_name} ", 1)
    elif "className={`" in tag:
        new_tag = tag.replace("className={`", f"className={{`{class_name} ", 1)
    else:
        new_tag = tag[:-1] + f' className="{class_name}">'

    return text[:button_start] + new_tag + text[button_end + 1:], True


def insert_style_after_root_div(text, root_anchor, style_block, style_marker, label):
    if style_marker in text:
        return text, False

    anchor_index = text.find(root_anchor)

    if anchor_index == -1:
        raise RuntimeError(f"Could not find root anchor for {label}")

    root_div_start = text.find("<div", anchor_index)

    if root_div_start == -1:
        raise RuntimeError(f"Could not find root <div> for {label}")

    root_div_end = find_opening_tag_end(text, root_div_start)

    return text[:root_div_end + 1] + "\n" + style_block + text[root_div_end + 1:], True


panel_style = r'''        <style className="roadmap-button-visibility-override-style">
          {`
            .roadmap-force-visible-button {
              position: relative !important;
              isolation: isolate !important;
              overflow: hidden !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              color: #ffffff !important;
              opacity: 1 !important;
              border: 1px solid rgba(221, 214, 254, 0.88) !important;
              box-shadow:
                0 16px 36px rgba(109, 40, 217, 0.38),
                inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
              text-shadow: 0 1px 8px rgba(0, 0, 0, 0.22) !important;
            }

            .roadmap-force-visible-button:hover:not(:disabled) {
              transform: translateY(-1px) !important;
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 20px 44px rgba(109, 40, 217, 0.46),
                inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
            }

            .roadmap-force-visible-button:disabled {
              background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
              color: #ffffff !important;
              opacity: 0.88 !important;
              cursor: not-allowed !important;
              box-shadow:
                0 12px 28px rgba(109, 40, 217, 0.26),
                inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
            }

            .roadmap-force-visible-button,
            .roadmap-force-visible-button span,
            .roadmap-force-visible-button svg {
              color: #ffffff !important;
              stroke: #ffffff !important;
              opacity: 1 !important;
            }
          `}
        </style>'''

modal_style = r'''      <style className="roadmap-create-button-visibility-override-style">
        {`
          .roadmap-create-force-visible-button {
            position: relative !important;
            isolation: isolate !important;
            overflow: hidden !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            opacity: 1 !important;
            border: 1px solid rgba(221, 214, 254, 0.88) !important;
            box-shadow:
              0 16px 36px rgba(109, 40, 217, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.22) !important;
          }

          .roadmap-create-force-visible-button:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.46),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
          }

          .roadmap-create-force-visible-button:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
            color: #ffffff !important;
            opacity: 0.88 !important;
            cursor: not-allowed !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.26),
              inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
          }

          .roadmap-create-force-visible-button,
          .roadmap-create-force-visible-button span,
          .roadmap-create-force-visible-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
            opacity: 1 !important;
          }
        `}
      </style>'''

panel_updated = panel_original
modal_updated = modal_original

panel_updated, panel_style_inserted = insert_style_after_root_div(
    panel_updated,
    "Track milestones, deadlines, and delivery progress as tasks move across the project.",
    panel_style,
    "roadmap-button-visibility-override-style",
    "RoadmapPanel",
)

panel_updated, add_class_added = add_class_to_button_before_text(
    panel_updated,
    "Add Milestone",
    "roadmap-force-visible-button",
    "RoadmapPanel Add Milestone button",
)

modal_updated, modal_style_inserted = insert_style_after_root_div(
    modal_updated,
    "Create Milestone",
    modal_style,
    "roadmap-create-button-visibility-override-style",
    "AddMilestoneModal",
)

modal_updated, create_class_added = add_class_to_button_before_text(
    modal_updated,
    "Create Milestone",
    "roadmap-create-force-visible-button",
    "AddMilestoneModal Create Milestone button",
)

# Safety checks: do not allow the previous JSX corruption pattern to return.
bad_patterns = [
    'onClick={() = className=',
    'onClick={()= className=',
    'onClick={() =',
]

for bad in bad_patterns:
    if bad in panel_updated or bad in modal_updated:
        raise RuntimeError(
            f"Unsafe JSX corruption pattern still present: {bad}. No changes were written."
        )

ROADMAP_PANEL.write_text(panel_updated)
ADD_MODAL.write_text(modal_updated)

print("Roadmap button visibility fix applied successfully.")
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
print(f"- RoadmapPanel style inserted: {panel_style_inserted}")
print(f"- Add Milestone class added: {add_class_added}")
print(f"- AddMilestoneModal style inserted: {modal_style_inserted}")
print(f"- Create Milestone class added: {create_class_added}")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No milestone creation, editing, deletion, filtering, sorting, or refresh logic was changed.")
